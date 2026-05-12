import { useNavigation } from '@react-navigation/native';

import { AccountsList, type OnSelectAccount } from '@suite-native/accounts';
import { events } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    type SendStackParamList,
    SendStackRoutes,
    type StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

type NavigationProps = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AccountAssets,
    SendStackParamList
>;

export const SendAccountsScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const analytics = useAnalytics();
    const navigation = useNavigation<NavigationProps>();

    const handleSelectAccount: OnSelectAccount = ({ account, hasAnyKnownTokens }) => {
        if (hasAnyKnownTokens) {
            navigation.navigate(RootStackRoutes.AccountAssets, {
                accountKey: account.key,
                flowType: 'send',
            });

            return;
        }

        analytics.report({
            type: events.sendFlowEnteredEvent.name,
            payload: {
                location: 'dashboard',
                assetSymbol: account.symbol,
            },
        });

        navigation.navigate(SendStackRoutes.SendOutputs, {
            accountKey: account.key,
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
            <AccountsList onSelectAccount={handleSelectAccount} isSendFilterEnabled />
        </Screen>
    );
};
