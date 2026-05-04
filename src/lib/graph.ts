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
  excerpt: string;
  /** SRS state from awen-sync, when the note has flashcards. */
  srs_state?: 'new' | 'learning' | 'settling' | 'settled';
  /** 0..1 share of reviews answered with quality ≥ 3. */
  retention?: number;
  /** Number of flashcards under the note. */
  card_count?: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphInput {
  id: string;
  data: {
    title?: string;
    tags?: string[];
    srs_state?: 'new' | 'learning' | 'settling' | 'settled';
    retention?: number;
    card_count?: number;
  };
  body?: string;
}

export function buildGraphData(notes: GraphInput[]): GraphData {
  const nodes: GraphNode[] = notes.map((note) => ({
    id: slugify(note.id),
    label: note.data.title || note.id,
    tags: note.data.tags || [],
    excerpt: (note.body || '')
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_: string, t: string, d: string) => d || t)
      .replace(/[#*`>\[\]!-]/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .trim()
      .slice(0, 120),
    srs_state: note.data.srs_state,
    retention: note.data.retention,
    card_count: note.data.card_count,
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
