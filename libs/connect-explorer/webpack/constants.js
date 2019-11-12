import path from 'path';

export const ABSOLUTE_BASE = path.normalize(path.join(__dirname, '..'));

const constants = Object.freeze({
    BUILD: path.join(ABSOLUTE_BASE, 'build/'),
    SRC: path.join(ABSOLUTE_BASE, 'src/'),
    PORT: 8082,
    INDEX: path.join(ABSOLUTE_BASE, 'src/index.html'),
    TREZOR_CONNECT_ROOT: path.join(ABSOLUTE_BASE, '../trezor-connect/'),
});

export const { TREZOR_CONNECT_ROOT } = constants;
export const TREZOR_CONNECT = path.join(constants.TREZOR_CONNECT_ROOT, 'src/js/index');
export const TREZOR_IFRAME = path.join(constants.TREZOR_CONNECT_ROOT, 'src/js/iframe/iframe.js');
export const TREZOR_POPUP = path.join(constants.TREZOR_CONNECT_ROOT, 'src/js/popup/popup.js');
export const TREZOR_CONNECT_HTML = path.join(constants.TREZOR_CONNECT_ROOT, 'src/html/');
export const TREZOR_CONNECT_FILES = path.join(constants.TREZOR_CONNECT_ROOT, 'src/data/');
export const { BUILD } = constants;
export const { SRC } = constants;
export const { PORT } = constants;
export const { INDEX } = constants;

export default constants;
