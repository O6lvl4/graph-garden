import type { AstroIntegration } from 'astro';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { remarkWikilinks } from './lib/remark-wikilinks.js';

export interface GraphGardenConfig {
  /** Path to the markdown vault directory (relative to project root) */
  vault: string;
  /** Site title shown in the header */
  title?: string;
  /** Additional Shiki languages for syntax highlighting */
  langs?: any[];
}

export default function graphGarden(config: GraphGardenConfig): AstroIntegration {
  const { vault, title = 'Knowledge', langs = [] } = config;

  const pkgDir = new URL('./', import.meta.url);
  const almideGrammar = JSON.parse(
    readFileSync(fileURLToPath(new URL('grammars/almide.tmLanguage.json', pkgDir)), 'utf-8')
  );

  return {
    name: '@o6lvl4/graph-garden',
    hooks: {
      'astro:config:setup': ({ updateConfig, injectRoute, config: astroConfig, command }) => {
        // Copy default favicon if user doesn't have one
        if (command === 'build' || command === 'dev') {
          const publicDir = fileURLToPath(astroConfig.publicDir);
          const faviconDest = resolve(publicDir, 'favicon.svg');
          if (!existsSync(faviconDest)) {
            mkdirSync(publicDir, { recursive: true });
            copyFileSync(
              fileURLToPath(new URL('../assets/favicon.svg', pkgDir)),
              faviconDest
            );
          }
        }
        const base = astroConfig.base || '/';

        updateConfig({
          markdown: {
            remarkPlugins: [[remarkWikilinks, { base }]],
            shikiConfig: {
              theme: 'github-dark',
              langs: [{ ...almideGrammar, aliases: ['almd'] }, ...langs],
            },
          },
          vite: {
            plugins: [
              {
                name: 'graph-garden-virtual',
                resolveId(id: string) {
                  if (id === 'virtual:graph-garden/config') return '\0virtual:graph-garden/config';
                },
                load(id: string) {
                  if (id === '\0virtual:graph-garden/config') {
                    return `export const title = ${JSON.stringify(title)};`;
                  }
                },
              },
            ],
          },
        });

        // Inject routes from package
        const pagesDir = new URL('pages/', pkgDir);
        const r = (file: string) => fileURLToPath(new URL(file, pagesDir));

        injectRoute({ pattern: '/', entrypoint: r('index.astro') });
        injectRoute({ pattern: '/graph', entrypoint: r('graph.astro') });
        injectRoute({ pattern: '/tags', entrypoint: r('tags/index.astro') });
        injectRoute({ pattern: '/tags/[tag]', entrypoint: r('tags/[tag].astro') });
        injectRoute({ pattern: '/notes/[...slug]', entrypoint: r('notes/[...slug].astro') });
        injectRoute({ pattern: '/search-index.json', entrypoint: r('search-index.json.ts') });
        injectRoute({ pattern: '/graph-data.json', entrypoint: r('graph-data.json.ts') });
      },
    },
  };
}

// Re-export utilities
export { slugify } from './lib/slugify.js';
export { extractWikilinks, buildGraphData } from './lib/graph.js';
export { remarkWikilinks } from './lib/remark-wikilinks.js';
