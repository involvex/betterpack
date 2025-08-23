import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"

const config = {
  input: "src/index.cjs",
  output: [
    {
      file: "dist/bpack.cjs",
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/bpack.mjs",
      format: "es",
      sourcemap: true,
    },
  ],
  plugins: [
    resolve({
      preferBuiltins: true,
      exportConditions: ["node"],
      extensions: [".js", ".cjs", ".mjs"],
    }),
    commonjs(),
    json(),
  ],
  external: [
    "child_process",
    "fs",
    "path",
    "readline",
    "events",
    "buffer",
    "string_decoder",
    "util",
    "os",
    "crypto",
    "http",
    "https",
    "url",
    "stream",
  ],
}

export default config
