const path = require('path');

module.exports = {
  mode: 'production',  
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            // options: {
            //   presets: ['@babel/preset-env'],
            //   plugins: ['@babel/plugin-transform-runtime']
            // } 可以放在外面 也可以放在里面
          }
        }
      ]
  }
};