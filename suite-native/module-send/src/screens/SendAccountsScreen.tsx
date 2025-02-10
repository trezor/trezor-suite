import { AccountsList, OnSelectAccount } from '@suite-native/accounts';
import { useTranslate } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
} from '@suite-native/navigation';

export const SendAccountsScreen = ({
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendAccounts>) => {
    const { translate } = useTranslate();

    const navigateToSendFormScreen: OnSelectAccount = ({ account, tokenAddress }) =>
        navigation.navigate(SendStackRoutes.SendOutputs, {
            accountKey: account.key,
            tokenContract: tokenAddress,
        });

    return (
        <Screen
            header={
                <ScreenHeader
                    content={translate('moduleSend.accountsList.title')}
                    closeActionType="close"
                />
            }
        >
            <AccountsList
                onSelectAccount={navigateToSendFormScreen}
                isSendFilterEnabled
                hideTokensIntoModal
            />
        </Screen>
    );
};
