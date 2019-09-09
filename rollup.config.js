// Do this as the first thing so that any code reading it knows the right env.
process.env.BUILD_ROLLUP = true

/* eslint-disable */
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const json = require('rollup-plugin-json')
const babel = require('rollup-plugin-babel')
const replace = require('rollup-plugin-replace')
const { uglify } = require('rollup-plugin-uglify')
const filesize = require('rollup-plugin-filesize')
const globals = require('rollup-plugin-node-globals')
const babelConfig = require('./babel.config')
/* eslint-enable */

const env = process.env.NODE_ENV
const version = process.env.npm_package_version
const [, packageName] = process.env.npm_package_name.split('@commercetools/')
const extensions = ['.js', '.jsx', '.ts', '.tsx']
const plugins = [
  json(),
  replace({
    'process.env.NODE_ENV': JSON.stringify(env),
    VERSION: `'${version}'`,
  }),
  resolve({
    extensions,
    mainFields: ['module', 'main', 'jsnext'],
    preferBuiltins: true,
    modulesOnly: true,
  }),
  commonjs({
    include: ['node_modules/**'],
  }),
  babel({
    exclude: ['node_modules/**'],
    runtimeHelpers: true,
    extensions,
    ...babelConfig,
  }),
  filesize(),
].filter(Boolean)

const createConfig = cliArgs => [
  {
    input: cliArgs.input,
    output: {
      format: 'umd',
      file: `dist/${packageName}.umd.js`,
      name: cliArgs.name,
    },
    plugins: plugins.concat([globals()]),
  },
  {
    input: cliArgs.input,
    output: {
      format: 'umd',
      file: `dist/${packageName}.umd.min.js`,
      name: cliArgs.name,
    },
    plugins: plugins.concat([globals(), uglify()]),
  },
  {
    input: cliArgs.input,
    output: {
      format: 'cjs',
      file: `dist/${packageName}.cjs.js`,
    },
    plugins,
  },
  {
    input: cliArgs.input,
    output: {
      format: 'es',
      file: `dist/${packageName}.es.js`,
    },
    plugins,
  },
]
module.exports = createConfig
