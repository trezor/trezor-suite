//eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore - may or may not exist during build:lib
import * as TrezorConnect from '../../../connect-web/build/trezor-connect.js';

export default TrezorConnect.default as any;
