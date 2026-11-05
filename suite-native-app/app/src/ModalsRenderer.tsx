import { AlertRenderer } from '@suite-native/alerts';
import { BiometricsModalRenderer } from '@suite-native/biometrics';
import { ToastRenderer } from '@suite-native/toasts';

export const ModalsRenderer = () => (
    <>
        <AlertRenderer />
        <ToastRenderer />
        <BiometricsModalRenderer />
    </>
);
