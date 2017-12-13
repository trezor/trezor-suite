import express from 'express';
import webpack from 'webpack';
import open from 'open';
import { argv } from 'yargs';
import { SRC, PORT, INDEX, ABSOLUTE_BASE, TREZOR_CONNECT } from './constants';
//import config from './webpack.config.library';

const config = argv.connect ? require('./webpack.config.connect') : require('./webpack.config.library');

const app = express();
const compiler = webpack(config);

app.use(require('webpack-dev-middleware')(compiler, {
    contentBase: '/',
    hot: true,
    inline: true,
    compress: true,
    noInfo: false,
    stats: { colors: true }
}));
app.use(require('webpack-hot-middleware')(compiler));

app.get('*', function(req, res) {
    res.sendFile(SRC + req.params[0]);
});

app.listen(PORT, 'localhost', function(err) {
    if (err) {
        console.log(err);
        return;
    }
    open(`http://localhost:${PORT}/`);
    console.log(`Listening at http://localhost:${PORT}`);
    console.log(`Serving ${INDEX}`);
});