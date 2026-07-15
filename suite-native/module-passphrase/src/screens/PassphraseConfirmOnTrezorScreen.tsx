import { Screen } from '@suite-native/navigation';
import { PassphraseConfirmOnTrezorScreenContent } from '@suite-native/passphrase';

import { PassphraseScreenHeader } from '../components/PassphraseScreenHeader';

export const PassphraseConfirmOnTrezorScreen = () => (
    <Screen header={<PassphraseScreenHeader />}>
        <PassphraseConfirmOnTrezorScreenContent />
    </Screen>
);
