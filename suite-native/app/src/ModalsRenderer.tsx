import { AlertRenderer } from '@suite-native/alerts';
import { PassphraseModalRenderer } from '@suite-native/passphrase';
import { ToastRenderer } from '@suite-native/toasts';
import { BiometricsModalRenderer } from '@suite-native/biometrics';
// import { NotificationRenderer } from '@suite-native/notifications';

import { Snow } from './snow/Snow';

export const ModalsRenderer = () => (
    <>
        <AlertRenderer />
        <PassphraseModalRenderer />
        <ToastRenderer />
        <Snow />
        <BiometricsModalRenderer />
        {/* Notifications are disabled until the problem with after-import notifications flooding is solved. */}
        {/* More here: https://github.com/trezor/trezor-suite/issues/7721  */}
        {/* <NotificationRenderer /> */}
    </>
);
