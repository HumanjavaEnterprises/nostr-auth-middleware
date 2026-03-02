import { build } from 'esbuild';
import path from 'path';

// Plugin to replace Node builtins with empty modules (same as webpack fallback: false)
// Exclude 'buffer' — nostr-crypto-utils uses the npm `buffer` polyfill package
const emptyNodeBuiltins = {
  name: 'empty-node-builtins',
  setup(build) {
    const builtins = [
      'crypto', 'stream', 'os', 'fs', 'path', 'http', 'https',
      'util', 'zlib', 'vm', 'assert', 'constants',
      'net', 'tls', 'child_process',
    ];
    const filter = new RegExp(`^(${builtins.join('|')})$`);

    build.onResolve({ filter }, (args) => ({
      path: args.path,
      namespace: 'empty-node-builtin',
    }));

    build.onLoad({ filter: /.*/, namespace: 'empty-node-builtin' }, () => ({
      contents: 'export default {};',
      loader: 'js',
    }));
  },
};

const result = await build({
  entryPoints: ['src/browser.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: 'iife',
  globalName: 'NostrAuthMiddleware',
  outfile: 'dist/browser/nostr-auth-middleware.min.js',
  target: ['es2020'],
  platform: 'browser',
  external: ['express', 'winston'],
  alias: {
    '@': path.resolve('src'),
  },
  plugins: [emptyNodeBuiltins],
  metafile: true,
});

const output = Object.entries(result.metafile.outputs)
  .filter(([k]) => k.endsWith('.js'))
  .map(([k, v]) => `${k}: ${(v.bytes / 1024).toFixed(1)}KB`);
console.log('Browser bundle built:', output.join(', '));
