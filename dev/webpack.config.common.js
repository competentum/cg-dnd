// Common Webpack configuration used all other webpack configurations
const path = require('path');
const webpack = require('webpack');

const BINARY_FILE_MAX_SIZE = 100000;
const BASE_DIR = '../src';
const OUTPUT_DIR = '../build';

const cgBanner = require('cg-components-banner');
const upperCamelCase = require('uppercamelcase');

const pkg = require('../package.json');
const banner = `${pkg.name} v${pkg.version} - ${pkg.description}\n\n${cgBanner}`;

module.exports = {
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, OUTPUT_DIR),
    library: upperCamelCase(pkg.name),
    libraryTarget: 'umd'
  },
  resolve: {
    modules: [
      path.resolve(__dirname, BASE_DIR),
      'node_modules'
    ],
    extensions: ['.js', '.json', '.scss']
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.BannerPlugin(banner)
  ],
  module: {
    loaders: [
      // https://github.com/webpack/webpack-dev-server/issues/1101
      {
        test: /\.js$/,
        use: [{
          loader: 'babel-loader',
          options: { cacheDirectory: true }
        }],
        include: /webpack-dev-server/,
      },
      // JavaScript / ES6
      {
        test: /\.(js)$/,
        include: path.resolve(__dirname, BASE_DIR),
        loader: 'babel-loader'
      },
      // Images
      // Inline base64 URLs for <=100k images, direct URLs for the rest
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: BINARY_FILE_MAX_SIZE,
            name: 'images/[name].[ext]'
          }
        }]
      },
      // Styles
      {
        test: /\.css$|\.less$/,
        loaders: [
          'style-loader', 'css-loader', 'postcss-loader', {
            loader: 'less-loader'
          }
        ]
      }
    ]
  }
};
