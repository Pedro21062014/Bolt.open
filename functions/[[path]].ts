import type { ServerBuild } from '@remix-run/cloudflare';
import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages';

// @ts-ignore
import * as serverBuild from '../build/server';

const handler = createPagesFunctionHandler({
  build: serverBuild as unknown as ServerBuild,
});

export const onRequest: PagesFunction<Env> = async (context) => {
  const response = await handler(context);
  
  // Headers críticos para SharedArrayBuffer e WebContainers
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  
  return response;
};