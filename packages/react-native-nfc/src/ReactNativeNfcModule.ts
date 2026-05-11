import { type NativeModule } from 'expo';
import { requireNativeModule } from 'expo-modules-core';

export type NdefRecord = {
    tnf: number;
    type: string;
    id: string;
    payload: string;
    payloadText: string | null;
};

export type NfcIntentEvent = {
    records: NdefRecord[];
};

type NfcEvents = {
    onNfcIntent: (event: NfcIntentEvent) => void;
};

declare class ReactNativeNfcModuleDeclaration extends NativeModule<NfcEvents> {
    getLaunchNdefRecords: () => NdefRecord[];
}

export const ReactNativeNfcModule =
    requireNativeModule<ReactNativeNfcModuleDeclaration>('ReactNativeNfc');
