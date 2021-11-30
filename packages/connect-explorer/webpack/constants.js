const path = require('path');

const ABSOLUTE_BASE = path.normalize(path.join(__dirname, '..'));
const BUILD = path.join(ABSOLUTE_BASE, 'build/');
const SRC = path.join(ABSOLUTE_BASE, 'src/');
const PORT = 8082;
const INDEX = path.join(ABSOLUTE_BASE, 'src/index.html');
const TREZOR_CONNECT_ROOT = path.join(ABSOLUTE_BASE, '../trezor-connect/');

const TREZOR_CONNECT = path.join(TREZOR_CONNECT_ROOT, 'src/js/index');
const TREZOR_IFRAME = path.join(TREZOR_CONNECT_ROOT, 'src/js/iframe/iframe.js');
const TREZOR_POPUP = path.join(TREZOR_CONNECT_ROOT, 'src/js/popup/popup.js');
const TREZOR_CONNECT_HTML = path.join(TREZOR_CONNECT_ROOT, 'src/html/');
const TREZOR_CONNECT_FILES = path.join(TREZOR_CONNECT_ROOT, 'src/data/');

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
};
