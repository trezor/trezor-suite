import { AccountsList, OnSelectAccount } from '@suite-native/accounts';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { useTranslate } from '@suite-native/intl';
import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';

import { SendScreen } from '../components/SendScreen';
import { SendScreenSubHeader } from '../components/SendScreenSubHeader';

// TODO: So far we do not want enable send form for any other networkS than Bitcoin-like coins.
// This filter will be removed in a follow up PR.
const BITCOIN_LIKE_FILTER = 'bitcoin';

export const SendAccountsScreen = ({
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendAccounts>) => {
    const { translate } = useTranslate();

    const navigateToSendFormScreen: OnSelectAccount = ({ account }) =>
        navigation.navigate(SendStackRoutes.SendOutputs, {
            accountKey: account.key,
        });

    // TODO: move text content to @suite-native/intl package when is copy ready
    return (
        <SendScreen
            screenHeader={<DeviceManagerScreenHeader />}
            subheader={<SendScreenSubHeader content={translate('moduleSend.accountsList.title')} />}
        >
            {/* TODO: Enable filtering same as receive screen account list has. */}
            <AccountsList
                onSelectAccount={navigateToSendFormScreen}
                filterValue={BITCOIN_LIKE_FILTER}
                hideTokensIntoModal
            />
        </SendScreen>
    );
};
