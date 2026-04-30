import { slugify } from './slugify';

const WIKILINK_RE = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/g;

export function extractWikilinks(content: string): string[] {
  const links: string[] = [];
  let match;
  const re = new RegExp(WIKILINK_RE.source, WIKILINK_RE.flags);
  while ((match = re.exec(content)) !== null) {
    links.push(match[1].trim());
  }
  return [...new Set(links)];
}

export interface GraphNode {
  id: string;
  label: string;
  tags: string[];
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function buildGraphData(
  notes: { id: string; data: { title?: string; tags?: string[] }; body?: string }[]
): GraphData {
  const nodes: GraphNode[] = notes.map((note) => ({
    id: slugify(note.id),
    label: note.data.title || note.id,
    tags: note.data.tags || [],
  }));

  const nodeIds = new Set(nodes.map((n) => n.id));
  const links: GraphLink[] = [];

  for (const note of notes) {
    const sourceSlug = slugify(note.id);
    const targets = extractWikilinks(note.body || '');

    for (const target of targets) {
      const targetSlug = slugify(target);
      if (nodeIds.has(targetSlug) && targetSlug !== sourceSlug) {
        links.push({ source: sourceSlug, target: targetSlug });
      }
    }
  }

  return { nodes, links };
}
