import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { AccountsListWithFilter, type OnSelectAccount } from '@suite-native/accounts';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type SendStackParamList,
    SendStackRoutes,
    type StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AccountAssets,
    SendStackParamList
>;

export const SendAccountsScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { analytics } = useServices<NativeAnalyticsDep>();
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
        <Screen>
            <AccountsListWithFilter
                title={<Translation id="moduleSend.accountsList.title" />}
                onSelectAccount={handleSelectAccount}
                closeActionType="close"
                closeAction={navigateToInitialScreen}
                isSendFlow
            />
        </Screen>
    );
};
