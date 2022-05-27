const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode:'development',
  entry: './src/deps.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
      new HtmlWebpackPlugin({ template: './index.html' ,inject: 'head',scriptLoading: 'blocking'}),
      new webpack.DefinePlugin({
        'process.env.NODE_DEBUG': false,
      }),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
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
}