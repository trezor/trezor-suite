import { AuthenticationType } from 'expo-local-authentication';

import { getIsFacialBiometricEnabled, getIsFingerprintBiometricEnabled } from '../utils';

describe('getIsFacialBiometricEnabled', () => {
    test('should return true if facial recognition and iris are enabled', () => {
        const enabledBiometrics: AuthenticationType[] = [
            AuthenticationType.FACIAL_RECOGNITION,
            AuthenticationType.IRIS,
        ];
        const result = getIsFacialBiometricEnabled(enabledBiometrics);
        expect(result).toBe(true);
    });

    test('should return true if only facial recognition is enabled', () => {
        const enabledBiometrics: AuthenticationType[] = [AuthenticationType.FACIAL_RECOGNITION];
        const result = getIsFacialBiometricEnabled(enabledBiometrics);
        expect(result).toBe(true);
    });

    test('should return true if only iris is enabled', () => {
        const enabledBiometrics: AuthenticationType[] = [AuthenticationType.IRIS];
        const result = getIsFacialBiometricEnabled(enabledBiometrics);
        expect(result).toBe(true);
    });

    test('should return false if no facial recognition or iris is enabled', () => {
        const enabledBiometrics: AuthenticationType[] = [];
        const result = getIsFacialBiometricEnabled(enabledBiometrics);
        expect(result).toBe(false);
    });

    test('should return false if is only fingerprint enabled', () => {
        const enabledBiometrics: AuthenticationType[] = [AuthenticationType.FINGERPRINT];
        const result = getIsFacialBiometricEnabled(enabledBiometrics);
        expect(result).toBe(false);
    });
});

describe('getIsFingerprintBiometricEnabled', () => {
    test('should return true if fingerprint is enabled', () => {
        const enabledBiometrics: AuthenticationType[] = [AuthenticationType.FINGERPRINT];
        const result = getIsFingerprintBiometricEnabled(enabledBiometrics);
        expect(result).toBe(true);
    });

    test('should return false if no biometric is enabled', () => {
        const enabledBiometrics: AuthenticationType[] = [];
        const result = getIsFingerprintBiometricEnabled(enabledBiometrics);
        expect(result).toBe(false);
    });

    test('should return false if only face recognition biometrics are enabled', () => {
        const enabledBiometrics: AuthenticationType[] = [
            AuthenticationType.IRIS,
            AuthenticationType.FACIAL_RECOGNITION,
        ];
        const result = getIsFingerprintBiometricEnabled(enabledBiometrics);
        expect(result).toBe(false);
    });
});
