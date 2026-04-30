import { visit, SKIP } from 'unist-util-visit';
import { slugify } from './slugify';

interface Options {
  base?: string;
}

export function remarkWikilinks(options: Options = {}) {
  const base = options.base ?? '';

  return (tree: any) => {
    visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
      if (index === undefined || !parent) return;
      // Don't transform inside existing links
      if (parent.type === 'link' || parent.type === 'linkReference') return;

      const value = node.value as string;
      const regex = /\[\[([^\]]+)\]\]/g;
      const children: any[] = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(value)) !== null) {
        const [full, inner] = match;

        // Parse: "target#heading|display" or "target|display" or "target"
        const pipeIdx = inner.indexOf('|');
        const raw = pipeIdx !== -1 ? inner.slice(0, pipeIdx).trim() : inner.trim();
        const display = pipeIdx !== -1 ? inner.slice(pipeIdx + 1).trim() : inner.trim();

        // Separate heading/block ref from target
        const hashIdx = raw.indexOf('#');
        const target = hashIdx !== -1 ? raw.slice(0, hashIdx) : raw;
        const fragment = hashIdx !== -1 ? raw.slice(hashIdx) : '';

        // Text before the match
        if (match.index > lastIndex) {
          children.push({ type: 'text', value: value.slice(lastIndex, match.index) });
        }

        const slug = slugify(target);
        children.push({
          type: 'link',
          url: `${base}/notes/${slug}${fragment}`,
          children: [{ type: 'text', value: display }],
          data: { hProperties: { className: ['wikilink'] } },
        });

        lastIndex = match.index + full.length;
      }

      if (children.length > 0) {
        if (lastIndex < value.length) {
          children.push({ type: 'text', value: value.slice(lastIndex) });
        }
        parent.children.splice(index!, 1, ...children);
        return [SKIP, index! + children.length] as any;
      }
    });
  };
}
