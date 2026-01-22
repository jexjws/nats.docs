// Rspress v2 plugin for GitBook assets
// This plugin rewrites .gitbook/assets/ paths to /images/ and copies assets

import { visit } from 'unist-util-visit';
import path from 'path';
import fs from 'fs';

 export function pluginGitBookAssets() {
   return {
     name: 'plugin-gitbook-assets',
     
     // Add remark plugin to rewrite image paths and import statements
     markdown: {
       remarkPlugins: [
         () => (tree) => {
           // Handle image nodes
           visit(tree, 'image', (node) => {
             const { url } = node;
             if (!url) return;
             
             // Check if this is a GitBook asset reference
             if (url.includes('.gitbook/assets/')) {
               // Extract the filename from the path
               const filename = path.basename(url);
               // Create new public path
               const newUrl = `/images/${filename}`;
               console.log(`[GitBook Assets] Rewriting image: ${url} -> ${newUrl}`);
               node.url = newUrl;
             } else if (!url.startsWith('/') && !url.startsWith('./') && !url.startsWith('../') && !url.startsWith('http://') && !url.startsWith('https://')) {
               // Relative image path without ./ prefix, add ./
               const newUrl = `./${url}`;
               console.log(`[GitBook Assets] Adding ./ prefix to relative image: ${url} -> ${newUrl}`);
               node.url = newUrl;
             }
           });
          
          // Handle MDX import statements (mdxjsEsm nodes)
          visit(tree, 'mdxjsEsm', (node) => {
            if (node.value && node.value.includes('.gitbook/assets/')) {
              // Replace .gitbook/assets/ paths with /images/ in import statements
              const originalValue = node.value;
              // Use regex to match import paths containing .gitbook/assets/
              // This matches: from "PATH" or from 'PATH'
              const regex = /(from\s+["'])(.*?\.gitbook\/assets\/.*?)(["'])/g;
              const newValue = originalValue.replace(regex, (match, prefix, assetPath, suffix) => {
                const filename = path.basename(assetPath);
                const newPath = `/images/${filename}`;
                console.log(`[GitBook Assets] Rewriting import: ${assetPath} -> ${newPath}`);
                return `${prefix}${newPath}${suffix}`;
              });
              
              if (newValue !== originalValue) {
                node.value = newValue;
              }
            }
          });
          
           // Handle code blocks with markup language
           visit(tree, 'code', (node) => {
             if (!node.lang) {
               node.lang = 'text';
             } else if (node.lang.toLowerCase() === 'markup') {
               node.lang = 'html';
             }
           });
        }
      ],
    },
    
    // Configure builder with alias for .gitbook/assets/
    builderConfig: {
      output: {
        assetPrefix: '/',
      },
      resolve: {
        alias: {
          // Create aliases for common .gitbook/assets paths
          // This helps resolve imports like "../.gitbook/assets/acks.svg"
          // We'll create multiple aliases for different relative paths
          '../.gitbook/assets': path.join(process.cwd(), 'docs', 'public', 'images'),
          '../../.gitbook/assets': path.join(process.cwd(), 'docs', 'public', 'images'),
          '../../../.gitbook/assets': path.join(process.cwd(), 'docs', 'public', 'images'),
          '../../../../.gitbook/assets': path.join(process.cwd(), 'docs', 'public', 'images'),
          '../../../../../.gitbook/assets': path.join(process.cwd(), 'docs', 'public', 'images'),
        },
      },
    },
    
    // Copy assets before build so they're available for imports
    async beforeBuild(config, isProd) {
      console.log('[GitBook Assets] Copying assets before build...');
      
      const imagesDir = path.join(process.cwd(), 'docs', 'public', 'images');
      
      // Ensure images directory exists
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      
      // Source directory - root .gitbook/assets
      const sourceDir = path.join(process.cwd(), '.gitbook', 'assets');
      
      let copiedCount = 0;
      if (fs.existsSync(sourceDir)) {
        try {
          const files = fs.readdirSync(sourceDir);
          for (const file of files) {
            const sourcePath = path.join(sourceDir, file);
            const destPath = path.join(imagesDir, file);
            
            if (fs.statSync(sourcePath).isFile()) {
              // Skip if already exists (avoid unnecessary copies)
              if (!fs.existsSync(destPath)) {
                fs.copyFileSync(sourcePath, destPath);
                copiedCount++;
              }
            }
          }
        } catch (err) {
          console.error(`[GitBook Assets] Error: ${err.message}`);
        }
      } else {
        console.warn(`[GitBook Assets] Source directory not found: ${sourceDir}`);
      }
      
      console.log(`[GitBook Assets] Copied ${copiedCount} files to ${imagesDir}`);
    },
    
    // Also copy assets after build for completeness
    async afterBuild(config, isProd) {
      console.log('[GitBook Assets] Ensuring assets are in output directory...');
      
      const outputDir = path.join(process.cwd(), 'doc_build');
      const outputImagesDir = path.join(outputDir, 'images');
      
      // Ensure images directory exists
      if (!fs.existsSync(outputImagesDir)) {
        fs.mkdirSync(outputImagesDir, { recursive: true });
      }
      
      // Copy from docs/public/images to doc_build/images
      const sourceDir = path.join(process.cwd(), 'docs', 'public', 'images');
      if (fs.existsSync(sourceDir)) {
        try {
          const files = fs.readdirSync(sourceDir);
          for (const file of files) {
            const sourcePath = path.join(sourceDir, file);
            const destPath = path.join(outputImagesDir, file);
            
            if (fs.statSync(sourcePath).isFile()) {
              fs.copyFileSync(sourcePath, destPath);
            }
          }
          console.log(`[GitBook Assets] Copied ${files.length} files to ${outputImagesDir}`);
        } catch (err) {
          console.error(`[GitBook Assets] Error: ${err.message}`);
        }
      }
    },
  };
}