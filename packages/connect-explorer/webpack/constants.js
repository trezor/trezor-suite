const path = require('path');

const ABSOLUTE_BASE = path.normalize(path.join(__dirname, '..'));

const constants = Object.freeze({
    BUILD: path.join(ABSOLUTE_BASE, 'build/'),
    SRC: path.join(ABSOLUTE_BASE, 'src/'),
    PORT: 8082,
    INDEX: path.join(ABSOLUTE_BASE, 'src/index.html'),
    TREZOR_CONNECT_ROOT: path.join(ABSOLUTE_BASE, '../trezor-connect/')
});

const TREZOR_CONNECT_ROOT = constants.TREZOR_CONNECT_ROOT;
const TREZOR_CONNECT = path.join(constants.TREZOR_CONNECT_ROOT, 'src/js/index');
const TREZOR_IFRAME = path.join(constants.TREZOR_CONNECT_ROOT, 'src/js/iframe/iframe.js');
const TREZOR_POPUP = path.join(constants.TREZOR_CONNECT_ROOT, 'src/js/popup/popup.js');
const TREZOR_CONNECT_HTML = path.join(constants.TREZOR_CONNECT_ROOT, 'src/html/');
const TREZOR_CONNECT_FILES = path.join(constants.TREZOR_CONNECT_ROOT, 'src/data/');
const BUILD = constants.BUILD;
const SRC = constants.SRC;
const PORT = constants.PORT;
const INDEX = constants.INDEX;

module.exports = {
    ABSOLUTE_BASE,
    TREZOR_CONNECT_ROOT,
    TREZOR_CONNECT,
    TREZOR_IFRAME,
    TREZOR_POPUP,
    TREZOR_CONNECT_HTML,
    TREZOR_CONNECT_FILES,
    BUILD,
    SRC,
    PORT,
    INDEX,
} 