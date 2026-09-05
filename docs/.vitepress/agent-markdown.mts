import fs from 'node:fs';
import path from 'node:path';
import type { PageData, SiteConfig } from 'vitepress';
import { siteUrl } from './config/locales.mts';

const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8';

interface AgentPage {
  /** Public route of the HTML page, for example `/guide/types` or `/tr`. */
  route: string;
  /** Generated markdown file path relative to the build output directory. */
  outputPath: string;
  /** Absolute path of the markdown source file. */
  sourcePath: string;
  frontmatter: Record<string, unknown>;
}

const pages = new Map<string, AgentPage>();

/**
 * Records a page during the build so its markdown twin can be emitted later.
 *
 * @param pageData - Page metadata provided by VitePress.
 * @param srcDir - Absolute content directory of the site.
 */
export const collectAgentPage = (pageData: PageData, srcDir: string): void => {
  const { relativePath, filePath, frontmatter } = pageData;

  if (!filePath || !relativePath.endsWith('.md')) {
    return;
  }

  // Files under `public/` are copied verbatim; they are not documentation pages.
  if (relativePath.startsWith('public/')) {
    return;
  }

  const withoutExtension = relativePath.slice(0, -'.md'.length);
  const routeBase = withoutExtension.replace(/(^|\/)index$/, '$1');
  const route = `/${routeBase}`.replace(/(.)\/$/, '$1');

  pages.set(route, {
    route,
    // Derived from the route rather than the source path so that a locale home
    // such as `/tr` resolves to `tr.md`, matching what the middleware requests.
    outputPath: route === '/' ? 'index.md' : `${route.slice(1)}.md`,
    sourcePath: path.isAbsolute(filePath)
      ? filePath
      : path.resolve(srcDir, filePath),
    frontmatter,
  });
};

/**
 * Removes the YAML frontmatter block from a markdown source file.
 *
 * @param raw - Raw markdown source.
 * @returns The markdown body without frontmatter.
 */
const stripFrontmatter = (raw: string): string =>
  raw.replace(/^---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n?/, '');

/**
 * Collapses a wrapped frontmatter string into a single line.
 *
 * @param value - Value read from frontmatter.
 * @returns The value as a single-line string.
 */
const collapse = (value: unknown): string =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Rewrites VitePress custom containers into portable markdown.
 *
 * `code-group` wrappers are unwrapped because the fenced blocks inside them are
 * already valid markdown; every other container keeps its label as a heading.
 *
 * @param body - Markdown body of a page.
 * @returns Markdown without VitePress container fences.
 */
const flattenContainers = (body: string): string => {
  const lines: string[] = [];
  let insideCodeFence = false;

  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      insideCodeFence = !insideCodeFence;
      lines.push(line);
      continue;
    }

    if (insideCodeFence) {
      lines.push(line);
      continue;
    }

    const opening = /^:{3,}\s*([\w-]+)[ \t]*(.*?)\s*$/.exec(line);

    if (opening) {
      const [, type, label] = opening;

      if (type !== 'code-group') {
        lines.push(`**${label || type}**`, '');
      }

      continue;
    }

    if (/^:{3,}\s*$/.test(line)) {
      continue;
    }

    lines.push(line);
  }

  return lines.join('\n');
};

/**
 * Renders the frontmatter-only home layout as readable markdown.
 *
 * @param frontmatter - Frontmatter of a `layout: home` page.
 * @returns Markdown describing the hero and feature list.
 */
const renderHomePage = (frontmatter: Record<string, any>): string => {
  const hero = (frontmatter.hero ?? {}) as Record<string, any>;
  const sections: string[] = [`# ${collapse(hero.name ?? frontmatter.title)}`];

  if (hero.text) {
    sections.push(collapse(hero.text));
  }

  if (hero.tagline) {
    sections.push(collapse(hero.tagline));
  }

  if (Array.isArray(hero.actions) && hero.actions.length > 0) {
    sections.push(
      '## Start here',
      hero.actions
        .map(
          (action: Record<string, any>) =>
            `- [${collapse(action.text)}](${collapse(action.link)})`,
        )
        .join('\n'),
    );
  }

  if (Array.isArray(frontmatter.features) && frontmatter.features.length > 0) {
    sections.push(
      '## Features',
      frontmatter.features
        .map(
          (feature: Record<string, any>) =>
            `- **${collapse(feature.title)}** — ${collapse(feature.details)}`,
        )
        .join('\n'),
    );
  }

  sections.push(
    '## Machine-readable discovery',
    [
      `- [ARD capability catalog](${siteUrl}/.well-known/ai-catalog.json)`,
      `- [API catalog](${siteUrl}/.well-known/api-catalog)`,
      `- [Agent Skills index](${siteUrl}/.well-known/agent-skills/index.json)`,
      `- [MCP Server Card](${siteUrl}/.well-known/mcp/server-card.json)`,
    ].join('\n'),
  );

  return sections.join('\n\n');
};

/**
 * Builds the markdown representation served for a page.
 *
 * @param page - Collected page metadata.
 * @returns Markdown content including a canonical HTML pointer.
 */
const renderPage = (page: AgentPage): string => {
  const raw = fs.readFileSync(page.sourcePath, 'utf8');
  const body =
    page.frontmatter.layout === 'home'
      ? renderHomePage(page.frontmatter)
      : flattenContainers(stripFrontmatter(raw)).trim();

  const canonical = `${siteUrl}${page.route === '/' ? '/' : page.route}`;

  return `${body}\n\n---\n\nCanonical HTML page: ${canonical}\n`;
};

/**
 * Estimates the token count of a markdown document.
 *
 * The exact count depends on the consuming model's tokenizer, so this is the
 * common four-characters-per-token approximation surfaced as a hint.
 *
 * @param markdown - Generated markdown content.
 * @returns Estimated number of tokens.
 */
const estimateTokens = (markdown: string): number =>
  Math.max(1, Math.ceil(markdown.length / 4));

interface VercelHeader {
  key: string;
  value: string;
}

interface VercelRule {
  source: string;
  headers: VercelHeader[];
}

/**
 * Rebuilds `vercel.json` from `vercel.base.json` plus the generated routes.
 *
 * Content negotiation itself lives in `middleware.ts`, because Vercel gives the
 * filesystem precedence over `rewrites` and every page is pre-rendered to HTML.
 * These rules only describe the generated markdown files when they are fetched
 * directly, plus the `Vary` header the negotiated page routes need.
 *
 * @param root - VitePress project root that also holds the Vercel config.
 * @param generated - Emitted markdown files keyed by page.
 */
const syncVercelConfig = (
  root: string,
  generated: { page: AgentPage; tokens: number }[],
): void => {
  const basePath = path.resolve(root, 'vercel.base.json');
  const outputPath = path.resolve(root, 'vercel.json');
  const base = JSON.parse(fs.readFileSync(basePath, 'utf8'));

  const headers: VercelRule[] = [...(base.headers ?? [])];

  for (const { page, tokens } of generated) {
    headers.push({
      source: page.route,
      headers: [{ key: 'Vary', value: 'Accept' }],
    });

    headers.push({
      source: `/${page.outputPath}`,
      headers: [
        { key: 'Content-Type', value: MARKDOWN_CONTENT_TYPE },
        { key: 'x-markdown-tokens', value: String(tokens) },
      ],
    });
  }

  const config = { ...base, headers };
  const serialized = `${JSON.stringify(config, null, 2)}\n`;

  if (
    !fs.existsSync(outputPath) ||
    fs.readFileSync(outputPath, 'utf8') !== serialized
  ) {
    fs.writeFileSync(outputPath, serialized);
  }
};

/**
 * Writes a markdown twin for every documentation page and refreshes the Vercel
 * content negotiation rules that serve them.
 *
 * @param siteConfig - Resolved VitePress site configuration.
 */
export const writeAgentMarkdown = (siteConfig: SiteConfig): void => {
  const generated = [...pages.values()]
    .sort((a, b) => a.route.localeCompare(b.route))
    .map((page) => {
      const markdown = renderPage(page);
      const target = path.resolve(siteConfig.outDir, page.outputPath);

      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, markdown);

      return { page, tokens: estimateTokens(markdown) };
    });

  syncVercelConfig(siteConfig.root, generated);
};
