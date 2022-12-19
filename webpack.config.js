const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { ProvidePlugin, DefinePlugin } = require("webpack");
const { findEnvFile } = require("./tools");

console.log();

const envFile = findEnvFile("webpack");
require("dotenv").config({ path: envFile });
console.log("\x1b[36m%s\x1b[0m", `[webpack] ${envFile} found and loaded.`);

module.exports = {
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    entry: path.join(__dirname, "src", "index.js"),
    output: {
        path: path.resolve(__dirname, "dist")
    },
    module: {
        rules: [
            {
                test: /\.?js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"]
                    }
                }
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.(png|jp(e*)g|svg|gif)$/,
                use: ["file-loader"]
            },
            {
                test: /\.svg$/,
                use: ["@svgr/webpack"]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "index.html")
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: path.join(__dirname, "src", "favicon.ico"), to: path.join(__dirname, "dist") },
                { from: path.join(__dirname, "src", "icons"), to: path.join(__dirname, "dist", "icons") },
                { from: path.join(__dirname, "LICENSE"), to: path.join(__dirname, "dist") },
                { from: path.join(__dirname, "README.md"), to: path.join(__dirname, "dist") }
            ]
        }),
        new ProvidePlugin({
            process: "process/browser"
        }),
        new DefinePlugin({
            "process.env": JSON.stringify(process.env)
        })
    ],
    resolve: {
        fallback: {
            fs: false
        }
    }
};
