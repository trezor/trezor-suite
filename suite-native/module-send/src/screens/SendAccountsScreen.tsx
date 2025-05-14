import { AccountsList, OnSelectAccount } from '@suite-native/accounts';
import { EventType, analytics } from '@suite-native/analytics';
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

    const navigateToSendFormScreen: OnSelectAccount = ({ account, tokenAddress, tokenSymbol }) => {
        analytics.report({
            type: EventType.SendFlowEntered,
            payload: {
                location: 'dashboard',
                assetSymbol: account.symbol,
                tokenContract: tokenAddress,
                tokenSymbol,
            },
        });

        navigation.navigate(SendStackRoutes.SendOutputs, {
            accountKey: account.key,
            tokenContract: tokenAddress,
        });
    };

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
