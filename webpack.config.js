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
    extensions: ['.ts', '.js', '.mjs'],
    extensionAlias: {
      '.js': ['.ts', '.js']
    },
    alias: {
      '@': path.resolve(__dirname, 'src')
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
      "util": false,
      "zlib": false,
      "vm": false,
      "assert": false,
      "constants": false,
      "net": false,
      "tls": false,
      "child_process": false
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /\.d\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.browser.json',
              onlyCompileBundledFiles: true,
              transpileOnly: true,
              compilerOptions: {
                module: 'NodeNext',
                moduleResolution: 'NodeNext'
              }
            }
          }
        ],
        exclude: /node_modules\/(?!nostr-crypto-utils)/
      },
      {
        test: /\.d\.ts$/,
        loader: 'ignore-loader'
      }
    ]
  },
  optimization: {
    minimize: true
  },
  externals: {
    express: 'express',
    winston: 'winston'
  }
};
