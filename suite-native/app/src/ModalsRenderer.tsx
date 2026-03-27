import { AlertRenderer } from '@suite-native/alerts';
import { BiometricsModalRenderer } from '@suite-native/biometrics';
import { NotificationRenderer } from '@suite-native/notifications';
import { ToastRenderer } from '@suite-native/toasts';

export const ModalsRenderer = () => (
    <>
        {/* Notifications are disabled until the problem with after-import notifications flooding is solved. */}
        {/* More here: https://github.com/trezor/trezor-suite/issues/7721  */}
        <NotificationRenderer />
        <AlertRenderer />
        <ToastRenderer />
        <BiometricsModalRenderer />
    </>
);
