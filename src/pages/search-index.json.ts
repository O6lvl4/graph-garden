import { getCollection } from 'astro:content';
import { slugify } from '../lib/slugify';

export async function GET() {
  const notes = await getCollection('notes', ({ id, data }) => id !== 'index' && data.public !== false);

  const index = notes.map((note) => ({
    slug: slugify(note.id),
    title: note.data.title || note.id,
    tags: note.data.tags || [],
    excerpt: (note.body || '')
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_: string, t: string, d: string) => d || t)
      .replace(/[#*`>\[\]!]/g, '')
      .trim()
      .slice(0, 200),
  }));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
}
