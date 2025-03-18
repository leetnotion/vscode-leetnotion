const { build } = require("esbuild");

const baseConfig = {
    bundle: true,
    minify: true,
    sourcemap: false,
};

const extensionConfig = {
    ...baseConfig,
    platform: "node",
    target: "es6",
    mainFields: ["module", "main"],
    format: "cjs",
    entryPoints: ["./src/extension.ts"],
    outfile: "./out/src/extension.js",
    external: ["vscode"],
};

const webviewConfig = {
    ...baseConfig,
    target: "es2020",
    format: "esm",
    entryPoints: ["./src/webview/vscode-components.ts"],
    outfile: "./public/scripts/vscode-components.js",
};

(async () => {
    try {
        await build(extensionConfig);
        await build(webviewConfig);
    } catch (error) {
        process.stderr.write(error.stderr);
        process.exit(1);
    }
})();
