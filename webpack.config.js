import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: './src/browser.ts',
  output: {
    filename: 'nostr-auth-middleware.min.js',
    path: path.resolve(__dirname, 'dist/browser'),
    library: {
      name: 'NostrAuthMiddleware',
      type: 'umd',
      umdNamedDefine: true
    },
    globalObject: 'this'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    extensionAlias: {
      '.js': ['.ts', '.js']
    },
    fallback: {
      "os": false,
      "fs": false,
      "path": false,
      "http": false,
      "https": false,
      "stream": false,
      "crypto": false,
      "buffer": false,
      "util": false
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.browser.json',
              transpileOnly: true,
              compilerOptions: {
                module: 'ESNext'
              }
            }
          }
        ],
        exclude: /node_modules/
      }
    ]
  },
  optimization: {
    minimize: true
  },
  externals: {
    express: 'express'
  }
};
