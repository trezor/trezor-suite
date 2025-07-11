import NfcManager, { NfcTech } from 'react-native-nfc-manager';

NfcManager.start();

export const useNfcManager = () => {
    const startNfcScan = async () => {
        try {
            // register for the NFC tag with NDEF in it
            await NfcManager.requestTechnology(NfcTech.Ndef);
            // the resolved tag object will contain `ndefMessage` property
            const tag = await NfcManager.getTag();
            console.warn('Tag found', tag);
        } catch (ex) {
            console.warn('Oops!', ex);
        } finally {
            // stop the nfc scanning
            NfcManager.cancelTechnologyRequest();
        }
    };

    return { startNfcScan };
};
