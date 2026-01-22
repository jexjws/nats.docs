import { visit } from "unist-util-visit";

export function remarkRewriteLinks() {
	return (tree) => {
		visit(tree, "link", (node) => {
			// Check if url exists and is internal (doesn't start with http or //)
			if (
				node.url &&
				!node.url.startsWith("http") &&
				!node.url.startsWith("//") &&
				!node.url.startsWith("mailto:")
			) {
				// Rewrite .../#id to .../README#id
				if (/\/#[^/]+$/.test(node.url)) {
					node.url = node.url.replace(/\/(\#[^/]+)$/, "/README$1");
				}
				// Rewrite .../ to .../README
				else if (/\/$/.test(node.url)) {
					node.url = node.url + "README";
				} else if (
					!/\.[a-zA-Z0-9]+$/.test(node.url) &&
					!node.url.includes("#") &&
					!node.url.endsWith("/")
				) {
					// Rewrite .../folder to .../folder/README (if no extension and no hash)
					node.url = node.url + "/README";
				}
			}
		});
	};
}
