import { buildApp } from './app.js';

async function start() {
  const app = await buildApp();
  const port = parseInt(process.env.PORT || '4000', 10);
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    console.log(`🚀 SubFlow API Server running at http://${host}:${port}`);
    console.log(`📚 Swagger Documentation available at http://${host}:${port}/documentation`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
