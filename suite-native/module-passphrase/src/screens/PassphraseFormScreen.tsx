import { Screen } from '@suite-native/navigation';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { PassphraseForm } from '../components/PassphraseForm';
import { PassphraseScreenHeader } from '../components/PassphraseScreenHeader';

export const PassphraseFormScreen = () => {
    return (
        <Screen screenHeader={<PassphraseScreenHeader />}>
            <Text variant="titleSmall">
                <Translation id="modulePassphrase.title" />
            </Text>
            <PassphraseForm />
        </Screen>
    );
};
