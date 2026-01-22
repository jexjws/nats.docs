import type { RspressPlugin } from '@rspress/core';
import path from 'path';
import fs from 'fs';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

/**
 * Remark plugin to rewrite GitBook asset paths
 */
function remarkGitBookAssets() {
  return (tree: Root) => {
    visit(tree, 'image', (node) => {
      const { url } = node;
      
      // Check if this is a GitBook asset reference
      if (url && url.includes('.gitbook/assets/')) {
        // Extract the filename from the path
        const filename = path.basename(url);
        // Create new public path
        const newUrl = `/images/${filename}`;
        console.log(`[GitBook Assets] Rewriting image path: ${url} -> ${newUrl}`);
        node.url = newUrl;
      }
    });
  };
}

/**
 * Rspress plugin to handle GitBook assets migration
 */
export function pluginGitBookAssets(): RspressPlugin {
  return {
    name: 'plugin-gitbook-assets',
    
    // Add remark plugin to rewrite image paths
    markdown: {
      remarkPlugins: [remarkGitBookAssets],
    },
    
    // Configure builder to handle static assets
    builderConfig: {
      output: {
        assetPrefix: '/',
        copy: [
          {
            from: 'docs/**/.gitbook/assets/**',
            to: 'images',
          },
        ],
      },
      tools: {
        rspack(config) {
          // Configure asset modules for images
          config.module = config.module || {};
          config.module.rules = config.module.rules || [];
          
          // Add rule for image files - treat them as static assets
          config.module.rules.push({
            test: /\.(png|jpe?g|gif|svg|webp)$/i,
            type: 'asset/resource',
            generator: {
              filename: 'images/[name][ext]',
            },
          });
          
          return config;
        },
      },
    },
    
    // Copy assets after build
    async afterBuild(config, isProd) {
      console.log('[GitBook Assets] Copying assets to output...');
      
      const outputDir = path.join(process.cwd(), 'doc_build');
      const imagesDir = path.join(outputDir, 'images');
      
      // Ensure images directory exists
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      
      // Source directories
      const sourceDirs = [
        path.join(process.cwd(), 'docs', 'en', '.gitbook', 'assets'),
        path.join(process.cwd(), 'docs', 'zh-cn', '.gitbook', 'assets'),
      ];
      
      let copiedCount = 0;
      for (const sourceDir of sourceDirs) {
        if (fs.existsSync(sourceDir)) {
          try {
            const files = fs.readdirSync(sourceDir);
            for (const file of files) {
              const sourcePath = path.join(sourceDir, file);
              const destPath = path.join(imagesDir, file);
              
              if (fs.statSync(sourcePath).isFile()) {
                fs.copyFileSync(sourcePath, destPath);
                copiedCount++;
              }
            }
          } catch (err) {
            console.error(`[GitBook Assets] Error copying from ${sourceDir}:`, (err as Error).message);
          }
        }
      }
      
      console.log(`[GitBook Assets] Copied ${copiedCount} assets to ${imagesDir}`);
    },
  };
}