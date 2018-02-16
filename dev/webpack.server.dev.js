// Creates a hot reloading development environment
/* eslint-disable no-console */
const colors = require('cli-color');
const path = require('path');
const ip = require('my-local-ip')();
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');

const config = require('./webpack.config.dev.js');

const compiler = webpack(config);

const DEFAULT_PORT = 3000;
const OUTPUT_DIR = '../build';

const hookStream = function hookStream(stream, data, cb) {
  const oldWrite = stream.write;

  // New stream write with our shiny function
  stream.write = (...args) => {
    // Old behaviour
    oldWrite.apply(stream, args);
    // Hook
    if (args[0].match(data)) {
      cb();
    }
  };
};

const runServer = function runServer(localip, freeport) {
  const address = 'http://' + localip + ':' + freeport + '/';

  const server = new WebpackDevServer(compiler, {
    contentBase: path.resolve(__dirname, OUTPUT_DIR),
    hot: true,
    historyApiFallback: false,
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    },
    publicPath: address,
    stats: { colors: true }
  });

  server.listen(freeport, localip, (err) => {
    if (err) {
      console.log(err);

      return;
    }

    console.log('Listening at', colors.green(address));

    hookStream(process.stdout, 'webpack built', () => {
      console.log('Running at', colors.green(address));
    });
  });
};

runServer(ip, DEFAULT_PORT);
