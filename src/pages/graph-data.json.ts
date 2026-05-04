import { getCollection } from 'astro:content';
import { buildGraphData } from '../lib/graph';

export async function GET() {
  const notes = await getCollection('notes', ({ id, data }) => data.public !== false && id !== 'index');
  const graphData = buildGraphData(
    notes.map((n) => ({
      id: n.id,
      data: {
        title: n.data.title,
        tags: n.data.tags,
        srs_state: (n.data as { srs_state?: 'new' | 'learning' | 'settling' | 'settled' }).srs_state,
        retention: (n.data as { retention?: number }).retention,
        card_count: (n.data as { card_count?: number }).card_count,
      },
      body: n.body,
    }))
  );

  return new Response(JSON.stringify(graphData), {
    headers: { 'Content-Type': 'application/json' },
  });
}
