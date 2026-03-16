import { AccountsList, type OnSelectAccount } from '@suite-native/accounts';
import { events } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type SendStackParamList,
    SendStackRoutes,
    type StackProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

export const SendAccountsScreen = ({
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendAccounts>) => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const analytics = useAnalytics();
    const navigateToSendFormScreen: OnSelectAccount = ({ account, tokenAddress, tokenSymbol }) => {
        analytics.report({
            type: events.sendFlowEnteredEvent.name,
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
                    title={<Translation id="moduleSend.accountsList.title" />}
                    closeActionType="close"
                    closeAction={navigateToInitialScreen}
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
