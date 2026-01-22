#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function replaceMarkupCodeBlocks() {
  const docsDir = path.join(__dirname, 'docs');
  let replacedCount = 0;
  let fileCount = 0;

  async function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
        fileCount++;
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Replace ```markup with ```html
        let newContent = content.replace(/```markup\b/g, '```html');
        
        if (newContent !== content) {
          fs.writeFileSync(fullPath, newContent, 'utf8');
          console.log(`Updated markup->html: ${fullPath}`);
          replacedCount++;
        }
      }
    }
  }

  await processDirectory(docsDir);
  
  console.log(`\nProcessed ${fileCount} files, made ${replacedCount} replacements.`);
}

replaceMarkupCodeBlocks().catch(console.error);