/* eslint-disable camelcase */
const webpack = require('webpack');
const merge = require('webpack-merge');
const config = require('./webpack.config.common.js');

const pkg = require('../package.json');

const env = {
  NODE_ENV: JSON.stringify('production')
};

const GLOBALS = {
  'process.env': env
};

module.exports = merge(config, {
  entry: {
    [pkg.name]: [
      'index'
    ],
    [`${pkg.name}.min`]: [
      'index'
    ]
  },
  plugins: [
    new webpack.DefinePlugin(GLOBALS),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        screw_ie8: true
      },
      sourceMap: false,
      include: /\.min\.js$/
    })
  ]
});
