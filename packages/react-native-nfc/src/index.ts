import { type NdefRecord, type NfcIntentEvent, ReactNativeNfcModule } from './ReactNativeNfcModule';

export type { NdefRecord, NfcIntentEvent };

export const getLaunchNdefRecords = (): NdefRecord[] => ReactNativeNfcModule.getLaunchNdefRecords();

export const addNfcIntentListener = (callback: (event: NfcIntentEvent) => void): (() => void) => {
    const subscription = ReactNativeNfcModule.addListener('onNfcIntent', callback);

    return () => subscription.remove();
};

/**
 * Start an NFC scan session (required on iOS, no-op on Android).
 *
 * On iOS, NFC tags cannot be read passively — a reader session must be
 * started explicitly. The session shows the system NFC dialog and resolves
 * when a tag is read or the user cancels. Detected records are emitted
 * via the `onNfcIntent` event.
 *
 * On Android, foreground dispatch handles this automatically, so calling
 * this function is a no-op.
 */
export const startScanSession = (): Promise<void> => ReactNativeNfcModule.startScanSession();
