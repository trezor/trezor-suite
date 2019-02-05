var webpack = require('webpack');
var path = require('path');
var libraryName = 'trezor-ui-components';
var outputFile = libraryName + '.js';

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: __dirname + '/src/index.js',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'npm/lib'),
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        loader: 'babel-loader',
        query: {
          presets: [
            '@babel/env', 
            '@babel/react'
          ]
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js']
  }
};
