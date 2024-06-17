import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { AccountsList } from '@suite-native/accounts';
import {
    GoBackIcon,
    Screen,
    ScreenSubHeader,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { AccountKey } from '@suite-common/wallet-types';

// TODO: So far we do not want enable send form for any other network than Bitcoin Testnet and Regtest.
// This filter will be removed in a follow up PR.
const TESTNET_FILTER = 'TEST';

export const SendAccountsScreen = ({
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendAccounts>) => {
    const navigateToSendFormScreen = (accountKey: AccountKey) =>
        navigation.navigate(SendStackRoutes.SendOutputs, {
            accountKey,
        });

    // TODO: move text content to @suite-native/intl package when is copy ready
    return (
        <Screen
            screenHeader={<DeviceManagerScreenHeader />}
            subheader={<ScreenSubHeader content="Send from" leftIcon={<GoBackIcon />} />}
        >
            {/* TODO: Enable filtering same as receive screen has. */}
            <AccountsList onSelectAccount={navigateToSendFormScreen} filterValue={TESTNET_FILTER} />
        </Screen>
    );
};
