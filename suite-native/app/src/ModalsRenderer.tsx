import { AlertRenderer } from '@suite-native/alerts';
import { BiometricsModalRenderer } from '@suite-native/biometrics';
import { ToastRenderer } from '@suite-native/toasts';
// import { NotificationRenderer } from '@suite-native/notifications';

import { Snow } from './snow/Snow';

export const ModalsRenderer = () => (
    <>
        <AlertRenderer />
        <ToastRenderer />
        <Snow />
        <BiometricsModalRenderer />
    </>
);
