import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { AccountsListWithFilter, type OnSelectAccount } from '@suite-native/accounts';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
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
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const navigation = useNavigation<NavigationProps>();

    const handleSelectAccount: OnSelectAccount = ({ account, hasAnyKnownTokens }) => {
        analytics.report({
            type: events.sendOptionsScreenEvent.name,
            payload: { option: 'account' },
        });

        if (hasAnyKnownTokens) {
            navigation.navigate(RootStackRoutes.AccountAssets, {
                accountKey: account.key,
                flowType: 'send',
            });

            return;
        }

        navigation.navigate(SendStackRoutes.SendOutputs, {
            accountKey: account.key,
        });
    };

    const handleClose = () => {
        analytics.report({
            type: events.sendOptionsScreenEvent.name,
            payload: { option: 'close' },
        });
        navigateToInitialScreen();
    };

    return (
        <Screen>
            <AccountsListWithFilter
                title={<Translation id="moduleSend.accountsList.title" />}
                onSelectAccount={handleSelectAccount}
                closeActionType="close"
                closeAction={handleClose}
                isSendFlow
            />
        </Screen>
    );
};
