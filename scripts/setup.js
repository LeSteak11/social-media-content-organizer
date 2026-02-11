import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

console.log('🚀 Setting up Social Media Content Organizer...\n');

// Create required directories
const dirs = [
  path.join(rootDir, 'data'),
  path.join(rootDir, 'uploads'),
  path.join(rootDir, 'uploads', 'temp'),
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('✓ Created directory:', dir);
  } else {
    console.log('✓ Directory exists:', dir);
  }
});

console.log('\n✨ Setup complete!\n');
console.log('Next steps:');
console.log('  1. Run: npm run dev');
console.log('  2. Open: http://localhost:3000');
console.log('  3. Start importing media and creating content!\n');
