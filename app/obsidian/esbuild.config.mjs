import obPlugin from "@aidenlx/esbuild-plugin-obsidian";
import { context } from "esbuild";
import { lessLoader } from "esbuild-plugin-less";
import { readFile } from "fs/promises";
import { join } from "path";
// import myPackage from "./package.json" assert { type: "json" };
import semverPrerelease from "semver/functions/prerelease.js";

const myPackage = JSON.parse(await readFile("./package.json"));
const isPreRelease = semverPrerelease(myPackage.version) !== null;

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source visit the plugins github repository
*/
`;

const cmExternals = [
  "@codemirror/autocomplete",
  "@codemirror/collab",
  "@codemirror/commands",
  "@codemirror/language",
  "@codemirror/lint",
  "@codemirror/search",
  "@codemirror/state",
  "@codemirror/text",
  "@codemirror/view",
  "@lezer/common",
  "@lezer/lr",
  "@lezer/highlight",
  "@codemirror/closebrackets",
  "@codemirror/comment",
  "@codemirror/fold",
  "@codemirror/gutter",
  "@codemirror/highlight",
  "@codemirror/history",
  "@codemirror/matchbrackets",
  "@codemirror/panel",
  "@codemirror/rangeset",
  "@codemirror/rectangular-selection",
  "@codemirror/stream-parser",
  "@codemirror/tooltip",
];

const isProd = process.env.BUILD === "production";

const preactCompatPlugin = {
  name: "preact-compat",
  setup(build) {
    const preact = join(process.cwd(), "node_modules", "@preact", "compat");
    build.onResolve({ filter: /^(react-dom|react)$/ }, (args) => {
      return { path: join(preact, "index.mjs") };
    });
    build.onResolve({ filter: /^react\/jsx-runtime$/ }, (args) => {
      return { path: join(preact, "jsx-runtime.mjs") };
    });
  },
};

/** @type import("esbuild").BuildOptions */
const opts = {
  bundle: true,
  platform: "node",
  logLevel: process.env.BUILD === "development" ? "info" : "silent",
  external: ["obsidian", "electron", "@electron/remote", ...cmExternals],
  format: "cjs",
  mainFields: ["browser", "module", "main"],
  sourcemap: isProd ? false : "inline",
  minify: isProd,
  loader: {
    ".svg": "text",
    ".ejs": "text",
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.BUILD),
  },
};
try {
  const ctx = await context({
    ...opts,
    entryPoints: ["src/zt-main.ts"],
    banner: { js: banner },
    outfile: "build/main.js",
    tsconfig: "tsconfig.build.json",
    plugins: [
      lessLoader(),
      obPlugin({ beta: isPreRelease }),
      preactCompatPlugin,
    ],
  });
  if (!isProd) {
    await ctx.watch();
  }
  ctx.dispose();
} catch (err) {
  console.error(err);
  process.exit(1);
}
