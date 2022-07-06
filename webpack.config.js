const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: 'development',//'production',
  entry: {
    bundle:'./src/index.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    //filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.[tj]s$/,
        exclude: /node_modules/,
        use: [ 
          {
            loader:'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            }
          },
          {
            loader:'ts-loader'
          }
        ]
      }
    ]
  },
  plugins: [
      new HtmlWebpackPlugin({ template: './index.html' ,inject: 'body',scriptLoading: 'blocking'}),
      new webpack.DefinePlugin({
        'process.env.NODE_DEBUG': false,
      }),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.IgnorePlugin({
        checkResource(resource) {
          return /.*\/wordlists\/(?!english).*\.json/.test(resource)
        }
      }),
      // new CopyPlugin({
      //   patterns: [
      //     { from: path.resolve(__dirname,'node_modules/@solana/web3.js/lib/index.iife.js'), to: path.resolve(__dirname,'dist/web3.js') },
      //   ],
      // }),
    ],
  resolve:{
      fallback:{
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer/"),
        "https": require.resolve("https-browserify"),
        "url": require.resolve("url/"),
        "http": require.resolve("stream-http"),
        "assert": require.resolve("assert/")
      }
  },
  optimization: {
    minimize: false,
  },
  devtool: "source-map"
  // externals:{
  //   '@solana/web3.js':'solanaWeb3'
  // }
}