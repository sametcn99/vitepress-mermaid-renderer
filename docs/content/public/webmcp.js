(() => {
  const modelContext = navigator.modelContext;

  if (!modelContext) return;

  const tools = [
    {
      name: 'search_documentation',
      description:
        'Find documentation links on the current VitePress Mermaid Renderer site that match a natural-language query.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Words or topic to search for.',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      execute: async ({ query }) => {
        const normalizedQuery = String(query ?? '')
          .toLowerCase()
          .trim();
        const links = [...document.querySelectorAll('a[href]')]
          .map((link) => ({
            title: link.textContent?.trim() ?? '',
            url: new URL(link.href, window.location.href).href,
          }))
          .filter(({ title, url }) =>
            `${title} ${url}`.toLowerCase().includes(normalizedQuery),
          )
          .slice(0, 10);

        return { query: normalizedQuery, results: links };
      },
    },
    {
      name: 'navigate_documentation',
      description:
        'Navigate the browser to a documentation page on the VitePress Mermaid Renderer site.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description:
              'A same-origin documentation path such as /guide/installation.',
          },
        },
        required: ['path'],
        additionalProperties: false,
      },
      execute: async ({ path }) => {
        const target = new URL(String(path ?? '/'), window.location.origin);
        if (target.origin !== window.location.origin) {
          throw new Error(
            'Only same-origin documentation paths are supported.',
          );
        }

        window.location.assign(target.href);
        return { navigatedTo: target.pathname };
      },
    },
  ];

  const controller = new AbortController();
  window.addEventListener('pagehide', () => controller.abort(), { once: true });

  if (typeof modelContext.registerTool === 'function') {
    for (const tool of tools) {
      modelContext.registerTool(tool, { signal: controller.signal });
    }
  } else if (typeof modelContext.provideContext === 'function') {
    modelContext.provideContext({ tools }).catch(() => undefined);
  }
})();
