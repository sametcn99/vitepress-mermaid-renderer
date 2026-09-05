import { next } from '@vercel/functions';

/**
 * Routing Middleware runs before the filesystem is consulted, which is what
 * makes markdown content negotiation possible on a fully static build: Vercel
 * `rewrites` are only evaluated when no static file matches the request path,
 * so they can never intercept a page that was pre-rendered to HTML.
 *
 * Asset paths and every file with an extension (including the generated `.md`
 * twins fetched below) are excluded so the middleware only runs for pages.
 */
export const config = {
  matcher: ['/((?!assets/|.*\\.).*)'],
};

const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8';

/**
 * Checks whether the client explicitly asked for a markdown representation.
 *
 * Browsers never advertise `text/markdown`, so HTML stays the default.
 *
 * @param accept - Raw `Accept` request header.
 * @returns True when `text/markdown` is one of the accepted media types.
 */
const wantsMarkdown = (accept: string | null): boolean =>
  (accept ?? '')
    .split(',')
    .some(
      (mediaType) =>
        mediaType.split(';')[0].trim().toLowerCase() === 'text/markdown',
    );

/**
 * Estimates the token count of a markdown document.
 *
 * The exact count depends on the consuming model's tokenizer, so this uses the
 * common four-characters-per-token approximation and is served as a hint.
 *
 * @param markdown - Markdown document body.
 * @returns Estimated number of tokens.
 */
const estimateTokens = (markdown: string): number =>
  Math.max(1, Math.ceil(markdown.length / 4));

/**
 * Serves the markdown twin of a documentation page when the client asks for it.
 *
 * @param request - Incoming request.
 * @returns The markdown response, or a pass-through to the HTML page.
 */
export default async function middleware(request: Request): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next();
  }

  if (!wantsMarkdown(request.headers.get('accept'))) {
    return next();
  }

  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, '');
  const markdownUrl = new URL(
    `${pathname === '' ? '/index' : pathname}.md`,
    url.origin,
  );

  const markdownResponse = await fetch(markdownUrl, {
    headers: { accept: 'text/plain' },
  });

  if (!markdownResponse.ok) {
    return next();
  }

  const markdown = await markdownResponse.text();

  return new Response(request.method === 'HEAD' ? null : markdown, {
    headers: {
      'Content-Type': MARKDOWN_CONTENT_TYPE,
      'x-markdown-tokens': String(estimateTokens(markdown)),
      Vary: 'Accept',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
