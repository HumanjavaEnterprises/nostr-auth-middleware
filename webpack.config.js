import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: './src/browser.ts',
  output: {
    path: path.resolve(__dirname, 'dist/browser'),
    filename: 'nostr-auth-middleware.min.js',
    library: {
      name: 'NostrAuthMiddleware',
      type: 'umd',
      umdNamedDefine: true
    },
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.esm.json'
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.mjs'],
    extensionAlias: {
      '.js': ['.js', '.ts'],
      '.mjs': ['.mjs', '.mts']
    }
  },
  externals: {
    'nostr-tools': 'nostr-tools',
    '@noble/hashes': '@noble/hashes',
    '@noble/curves': '@noble/curves',
    '@noble/secp256k1': '@noble/secp256k1'
  }
};
