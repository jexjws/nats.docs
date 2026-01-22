#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function replaceUppercaseLangs() {
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
        
        // Replace ```Python with ```python, ```C with ```c, etc.
        let newContent = content.replace(/```([A-Z][a-z]*)\b/g, (match, lang) => {
          const lowerLang = lang.toLowerCase();
          console.log(`Replacing ${lang} -> ${lowerLang} in ${fullPath}`);
          replacedCount++;
          return '```' + lowerLang;
        });
        
        if (newContent !== content) {
          fs.writeFileSync(fullPath, newContent, 'utf8');
          console.log(`Updated: ${fullPath}`);
        }
      }
    }
  }

  await processDirectory(docsDir);
  
  console.log(`\nProcessed ${fileCount} files, made ${replacedCount} replacements.`);
}

replaceUppercaseLangs().catch(console.error);