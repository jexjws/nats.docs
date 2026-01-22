import { defineConfig } from '@rspress/core';
import { pluginGitBookAssets } from './plugin-gitbook-assets.js';
import { remarkRewriteLinks } from './remark-rewrite-links.js';
import { pluginSitemap } from '@rspress/plugin-sitemap';
import ga from 'rspress-plugin-google-analytics';


export default defineConfig({
  root: 'docs',
  icon: '/favicon.ico',
  logo: {
    light: '/nats-horizontal-color.png',
    dark: '/nats-horizontal-color.png',
  },
  llms: true,
  lang: 'zh',
  locales: [
    {
      lang: 'en',
      label: 'English',
      title: 'NATS Documentation',
      description: 'Administrative, developer and conceptual documentation for the NATS messaging system.',
    },
    {
      lang: 'zh',
      label: '简体中文',
      title: 'NATS 说明书',
      description: 'NATS 消息系统的运维、开发和概念文档。',
    },
  ],
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/jexjws/nats.docs/tree/rspress',
      },
    ],
    footer: {
      message: 'UNOFFICIAL DOCS SITE - Copyright © 2025 NATS Maintainers',
    },
    editLink: {
      docRepoBaseUrl: 'https://github.com/jexjws/nats.docs/edit/rspress/docs',
    },
    lastUpdated: false,
    enableContentAnimation: true,
    enableAppearanceAnimation: true,
  },
  markdown: {
    remarkPlugins: [remarkRewriteLinks],
    link: {
      checkDeadLinks: false,
    },
  },
  plugins: [
    pluginGitBookAssets(),
    pluginSitemap({
      siteUrl: 'https://nats-docs-cn.voyage200.top/', // 据说pages.dev有的时候会被劫持并返回假证书，浏览器会阻止连接，所以使用自己的域名而不是pages.dev
    }),
    ga({
      id: 'G-X2FCFH31SQ',
    }),
  ],
});