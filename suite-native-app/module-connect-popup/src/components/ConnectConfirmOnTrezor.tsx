import { CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorAnimation } from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';

export const ConnectConfirmOnTrezor = () => (
    <VStack spacing="sp24" alignItems="center" justifyContent="center" padding="sp8">
        <ConfirmOnTrezorAnimation />
        <CenteredTitleHeader
            title={<Translation id="device.continueOnTrezor.title" />}
            subtitle={<Translation id="device.continueOnTrezor.subtitle" />}
        />
    </VStack>
);
