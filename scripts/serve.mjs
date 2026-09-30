#!/usr/bin/env node
// Copyright (c) 2026 Chinaready. SPDX-License-Identifier: Apache-2.0
//
// Zero-dependency local static server for Stack Break Lab (replaces the old
// docker/nginx dev container). Serves the repository root — directory URLs
// resolve to index.html, JSON is served no-store, mime types match production.

import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.xml': 'text/xml; charset=utf-8',
  '.webp': 'image/webp',
};

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let filePath = join(ROOT, urlPath);
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      const index = join(filePath, 'index.html');
      if (existsSync(index)) filePath = index;
      else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('404'); return; }
    }
    const ext = extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.json' ? 'no-store' : 'no-cache',
    });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain' }); res.end('500');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Stack Break Lab static server — http://localhost:${PORT}/`);
});
