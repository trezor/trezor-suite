import { CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorAnimation } from '@suite-native/device';
import { Translation } from '@suite-native/intl';

export const PassphraseConfirmOnTrezorScreenContent = () => (
    <VStack spacing="sp24" alignItems="center" justifyContent="center" flex={1} padding="sp8">
        <ConfirmOnTrezorAnimation />
        <CenteredTitleHeader
            title={<Translation id="modulePassphrase.confirmOnDevice.title" />}
            subtitle={<Translation id="modulePassphrase.confirmOnDevice.description" />}
        />
    </VStack>
);
