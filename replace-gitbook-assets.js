#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function replaceGitBookAssets() {
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
        
        // Replace image references: ![](.../.gitbook/assets/...)
        let newContent = content.replace(
          /!\[\]\((.*?\.gitbook\/assets\/[^)]+)\)/g,
          (match, assetPath) => {
            const filename = path.basename(assetPath);
            const newPath = `/images/${filename}`;
            console.log(`Replacing image: ${assetPath} -> ${newPath}`);
            replacedCount++;
            return `![](${newPath})`;
          }
        );
        
        // Replace import statements: import ... from ".../.gitbook/assets/..."
        newContent = newContent.replace(
          /(import\s+[^'"]*\s+from\s+['"])(.*?\.gitbook\/assets\/[^'"]+)(['"])/g,
          (match, prefix, assetPath, suffix) => {
            const filename = path.basename(assetPath);
            const newPath = `/images/${filename}`;
            console.log(`Replacing import: ${assetPath} -> ${newPath}`);
            replacedCount++;
            return `${prefix}${newPath}${suffix}`;
          }
        );
        
        // Replace markdown links: [...](.../.gitbook/assets/...)
        newContent = newContent.replace(
          /\[([^\]]+)\]\((.*?\.gitbook\/assets\/[^)]+)\)/g,
          (match, linkText, assetPath) => {
            const filename = path.basename(assetPath);
            const newPath = `/images/${filename}`;
            console.log(`Replacing link: ${assetPath} -> ${newPath}`);
            replacedCount++;
            return `[${linkText}](${newPath})`;
          }
        );
        
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

replaceGitBookAssets().catch(console.error);