/// <reference types="vitest" />
// @ts-ignore
import path from "path";
// @ts-ignore
import packageJson from "./package.prod.json";
import { defineConfig } from "vite";
import dtsBundleGenerator from "vite-plugin-dts-bundle-generator";

const getPackageName = () => {
  return packageJson.name;
};

const getPackageNameCamelCase = () => {
  try {
    return getPackageName().replace(/-./g, char => char[1].toUpperCase());
  } catch (err) {
    throw new Error("Name property in package.prod.json is missing.");
  }
};

const fileName = {
  es: "index.js",
  cjs: "index.cjs",
  umd: "index.umd.js",
};

const formats = Object.keys(fileName) as Array<keyof typeof fileName>;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export default defineConfig(({ command }) => ({
  base: "./",
  plugins: [
    dtsBundleGenerator({
      fileName: "index.d.ts",
    }),
  ],
  build: {
    minify: "terser",
    outDir: "./build",
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: getPackageNameCamelCase(),
      formats,
      fileName: format => (fileName as any)[format],
    },
    rollupOptions: {
      external: Object.keys(packageJson.dependencies),
    }
  },
  test: {
    watch: false,
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      { find: "@@", replacement: path.resolve(__dirname) },
    ],
  },
}));
