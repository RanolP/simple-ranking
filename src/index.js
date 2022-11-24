import { Router } from 'itty-router';

const router = new Router();

router
  .post(
    '/score/:classId',
    /**
     *
     * @param {import('itty-router').Request & { params: { classId: string } }} req
     * @param {{ DB: import('@cloudflare/workers-types').D1Database }} env
     */
    async (req, env) => {
      const body = await req.json?.();
      if (
        !body ||
        typeof body.nickname !== 'string' ||
        typeof body.score !== 'number'
      ) {
        return new Response('Invalid Request', { status: 400 });
      }

      const res = await env.DB.prepare('INSERT INTO scores VALUES (?, ?, ?)')
        .bind(Number(req.params.classId), body.nickname, body.score)
        .run();

      if (res.success) {
        return new Response('OK');
      } else {
        return new Response(res.error, { status: 500 });
      }
    },
  )
  .get(
    '/score/:classId/ranking',
    /**
     *
     * @param {import('itty-router').Request & { params: { classId: string } }} req
     * @param {{ DB: import('@cloudflare/workers-types').D1Database }} env
     */
    async (req, env) => {
      const res = await env.DB.prepare(
        'SELECT * FROM scores WHERE classId = ? ORDER BY score DESC LIMIT 10',
      )
        .bind(Number(req.params.classId))
        .all();

      if (res.success) {
        return new Response(JSON.stringify(res.results), {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else {
        return new Response(res.error, { status: 500 });
      }
    },
  )
  .all('*', () => new Response('Not Found.', { status: 404 }));

export default {
  fetch: router.handle,
};
