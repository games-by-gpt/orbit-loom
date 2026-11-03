import { build } from 'esbuild';
import { mkdir, copyFile, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'esm', target: 'es2022', outfile: 'dist/main.js' });
await Promise.all(['index.html', 'style.css'].map(f => copyFile(`src/${f}`, `dist/${f}`)));
console.log('Built Orbit Loom into dist/');
