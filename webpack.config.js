const path = require('path');

module.exports = {
    entry: {
        'worker': './src/index.ts',
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        }],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'worker.js',
        path: path.resolve(__dirname, 'dist'),
    },
};
