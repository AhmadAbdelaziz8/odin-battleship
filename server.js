import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = 3002;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  let path = req.url;

  // Default to index.html if the path is '/'
  if (path === '/') {
    path = '/index.html';
  }

  // Check if the request is for a source file
  if (path.startsWith('/src/')) {
    // Serve from src directory
    try {
      const filePath = join(__dirname, path);
      const content = await readFile(filePath, 'utf8');
      
      const ext = path.slice(path.lastIndexOf('.'));
      res.setHeader('Content-Type', MIME_TYPES[ext] || 'text/plain');
      res.statusCode = 200;
      res.end(content);
      return;
    } catch (error) {
      console.error(`Error reading file ${path}:`, error);
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
  }

  // For all other requests, try to serve from public directory
  try {
    const publicPath = join(__dirname, 'public', path.slice(1));
    const content = await readFile(publicPath, 'utf8');
    
    const ext = path.slice(path.lastIndexOf('.'));
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'text/plain');
    res.statusCode = 200;
    res.end(content);
  } catch (error) {
    console.error(`Error reading file ${path}:`, error);
    
    // If the file isn't found in public, return 404
    res.statusCode = 404;
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Battleship game server running at http://localhost:${PORT}/`);
  console.log(`Press Ctrl+C to stop the server`);
});
