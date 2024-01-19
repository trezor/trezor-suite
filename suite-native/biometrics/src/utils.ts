import { AuthenticationType } from 'expo-local-authentication';
import { pipe, A } from '@mobily/ts-belt';

export const getIsFacialBiometricEnabled = (enabledBiometrics: AuthenticationType[]) =>
    pipe(
        enabledBiometrics,
        A.intersection([AuthenticationType.FACIAL_RECOGNITION, AuthenticationType.IRIS]),
        A.isNotEmpty,
    );

export const getIsFingerprintBiometricEnabled = (enabledBiometrics: AuthenticationType[]) =>
    pipe(enabledBiometrics, A.includes(AuthenticationType.FINGERPRINT));
