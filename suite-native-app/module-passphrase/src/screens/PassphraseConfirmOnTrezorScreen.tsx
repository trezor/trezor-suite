import { Screen } from '@suite-native/navigation';
import {
    PassphraseConfirmOnTrezorScreenContent,
    PassphraseScreenHeader,
} from '@suite-native/passphrase';

export const PassphraseConfirmOnTrezorScreen = () => (
    <Screen header={<PassphraseScreenHeader />}>
        <PassphraseConfirmOnTrezorScreenContent />
    </Screen>
);
