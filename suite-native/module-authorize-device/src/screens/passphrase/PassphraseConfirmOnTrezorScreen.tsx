import { CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorAnimation } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';

import { PassphraseScreenHeader } from '../../components/passphrase/PassphraseScreenHeader';

export const PassphraseConfirmOnTrezorScreen = () => (
    <Screen header={<PassphraseScreenHeader />}>
        <VStack spacing="sp24" alignItems="center" justifyContent="center" flex={1} padding="sp8">
            <ConfirmOnTrezorAnimation />
            <CenteredTitleHeader
                title={<Translation id="modulePassphrase.confirmOnDevice.title" />}
                subtitle={<Translation id="modulePassphrase.confirmOnDevice.description" />}
            />
        </VStack>
    </Screen>
);
