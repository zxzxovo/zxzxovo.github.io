export async function onRequest({ next, env }) {
  const response = await next();

  if (response.status === 404) {
    const url = new URL(request.url);

    return env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
  }

  return response;
}