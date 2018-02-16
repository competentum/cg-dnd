const webpack = require('webpack');
const merge = require('webpack-merge');
const config = require('./webpack.config.common.js');
const ip = require('my-local-ip')();

const env = {
  NODE_ENV: JSON.stringify('development')
};
const pkg = require('../package.json');

const GLOBALS = {
  'process.env': env,
  __DEV__: JSON.stringify(JSON.parse(process.env.DEBUG || 'true'))
};

module.exports = merge(config, {
  cache: true,
  devtool: 'source-map',
  entry: {
    [pkg.name]: [
      `webpack-dev-server/client?http://${ip}:3000`,
      'webpack/hot/dev-server',
      'index'
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin(GLOBALS)
  ]
});
