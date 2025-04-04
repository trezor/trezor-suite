import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

export const WalletCreationScreen = () => (
    <Screen header={<ScreenHeader closeActionType="close" />}>
        <Text variant="titleMedium" textAlign="center">
            <Translation id="moduleDeviceOnboarding.walletCreationScreen.title" />
        </Text>
        {/* TODO: https://github.com/trezor/trezor-suite/issues/17457 */}
        <Text variant="titleSmall" color="textAlertRed" textAlign="center">
            TODO: Implement wallet creation screen
        </Text>
    </Screen>
);
