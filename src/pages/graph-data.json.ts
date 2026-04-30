import { getCollection } from 'astro:content';
import { buildGraphData } from '../lib/graph';

export async function GET() {
  const notes = await getCollection('notes', ({ data }) => data.public !== false);
  const graphData = buildGraphData(
    notes.map((n) => ({
      id: n.id,
      data: { title: n.data.title, tags: n.data.tags },
      body: n.body,
    }))
  );

  return new Response(JSON.stringify(graphData), {
    headers: { 'Content-Type': 'application/json' },
  });
}
