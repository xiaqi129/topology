const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
var CopyWebpackPlugin = require('copy-webpack-plugin');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    // devtool: "inline-source-map",
    devtool: false,
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'network.js',
        library: 'network',
        libraryTarget: 'umd'
    },
    // externals: {
    //     lodash: {
    //         commonjs: 'lodash',
    //         commonjs2: 'lodash',
    //         amd: 'lodash',
    //         root: '_'
    //     }
    // },
    performance: { hints: false },
    module: {
        rules: [{
            // use : 'babel-loader',
            loader: 'babel-loader',
            query: {
                presets: ['es2015']
                // ,'es2017'
            },
            test: /\.jsx?$/,
            exclude: /(node_modules|bower_components)/
        }, {
            test: /\.less$/,
            use: [{
                loader: 'style-loader'
            }, {
                loader: 'css-loader'
            }, {
                loader: 'less-loader', options: {
                    strictMath: true,
                    noIeCompat: true,
                    javascriptEnabled: true
                }
            }]
        }, {
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: /(node_modules|bower_components)/,
            query: {
                presets: ['es2015']
            }
        }, {
            test: /\.tsx?$/,
            loader: 'ts-loader',
            exclude: /node_modules/,
            options: {
                appendTsSuffixTo: [/\.vue$/],
            }
        }, {
            test: /.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
            use: [{
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    outputPath: './',
                    publicPath: '../'
                }
            }]
        }]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html'
        })
    ],
    devServer: {
        host: 'localhost',
        publicPath: '/',
        contentBase: path.resolve(__dirname, "src"),
        watchContentBase: true,
        compress: true,
        port: 9002,
        headers: {
            'Access-Control-Allow-Origin': "*"
        },
        historyApiFallback: true,
        'proxy': {
            '/api/**': {
                'target': 'https://eagleeye-tool.cisco.com:8000/project/',
                'pathRewrite': { '^/api': '' },
                'changeOrigin': true,
                secure: false,
                rejectUnauthorized: false
            }
        }
    }
};