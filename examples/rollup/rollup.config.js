import path from 'path';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import {terser} from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
import os from 'os';
const cpuNums = os.cpus().length;
export default {
    input: ['./src/index.js'],
    output: {
        dir: path.resolve(__dirname, 'dist'),
        format: 'cjs',
    },
    plugins: [
        resolve(),
        commonjs({
            include: 'node_modules/**', // 包括 
            exclude: [],  // 排除
        }),
        babel({
            runtimeHelpers: true,
            rootMode: 'upward'
        }),
        terser({
            output: {
                comments: false
            },
            include: [/^.+\.js$/],
            exclude: ['node_moudles/**'],
            numWorkers: cpuNums,
            sourcemap: false
        })
    ]
}