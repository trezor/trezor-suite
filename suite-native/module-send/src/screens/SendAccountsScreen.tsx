import { AccountsList, OnSelectAccount } from '@suite-native/accounts';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import {
    GoBackIcon,
    Screen,
    ScreenSubHeader,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
} from '@suite-native/navigation';

// TODO: So far we do not want enable send form for any other networkS than Bitcoin-like coins.
// This filter will be removed in a follow up PR.
const BITCOIN_LIKE_FILTER = 'bitcoin';

export const SendAccountsScreen = ({
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendAccounts>) => {
    const navigateToSendFormScreen: OnSelectAccount = ({ account }) =>
        navigation.navigate(SendStackRoutes.SendOutputs, {
            accountKey: account.key,
        });

    // TODO: move text content to @suite-native/intl package when is copy ready
    return (
        <Screen
            screenHeader={<DeviceManagerScreenHeader />}
            subheader={<ScreenSubHeader content="Send from" leftIcon={<GoBackIcon />} />}
        >
            {/* TODO: Enable filtering same as receive screen account list has. */}
            <AccountsList
                onSelectAccount={navigateToSendFormScreen}
                filterValue={BITCOIN_LIKE_FILTER}
                hideTokensIntoModal
            />
        </Screen>
    );
};
