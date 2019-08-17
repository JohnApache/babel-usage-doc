const presets = [
    [
        "@babel/env",
    ]
]

const plugins = [
    [
        "@babel/plugin-transform-runtime",
        {
            corejs: 3,
        }
    ]
]

const ignore = [
    /^.+\.test\.js$/,
    /^.+\.spec\.js$/,
    'node_modules/**'
]


module.exports = { 
    presets, 
    plugins, ignore, 
    inputSourceMap: true, 
    sourceType: 'module', 
    // compact: false, 
    // minified: true, 
    // comments: false
}