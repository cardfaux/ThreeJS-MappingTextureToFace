const path = require('path');
const { merge } = require('webpack-merge');

const commonConfiguration = require('./webpack.common');

module.exports = merge(commonConfiguration, {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, '../__dist'),
  },
});
