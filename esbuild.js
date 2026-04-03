const { build } = require('esbuild');

const baseConfig = {
	bundle: true,
	minify: true,
	sourcemap: false,
};

const extensionConfig = {
	...baseConfig,
	platform: 'node',
	target: 'es6',
	mainFields: ['module', 'main'],
	format: 'cjs',
	entryPoints: ['./src/extension.ts'],
	outfile: './out/src/extension.js',
	external: ['vscode'],
};

(async () => {
	try {
		await build(extensionConfig);
	} catch (error) {
		process.stderr.write(error.stderr);
		process.exit(1);
	}
})();
