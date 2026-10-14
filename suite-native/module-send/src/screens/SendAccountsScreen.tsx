import { useNavigation } from '@react-navigation/native';

import { AccountsListWithFilter, type OnSelectAccount } from '@suite-native/accounts';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
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
import { useServices } from '@trezor/dependency-injection';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendAccounts,
    RootStackParamList
>;

export const SendAccountsScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { analytics } = useServices(injectNativeAnalytics);
    const navigation = useNavigation<NavigationProps>();

    const handleSelectAccount: OnSelectAccount = ({ account, hasAnyKnownTokens }) => {
        analytics.report({
            type: events.sendOptionsScreenEvent.name,
            payload: { option: 'account' },
        });

        if (hasAnyKnownTokens) {
            navigation.navigate(RootStackRoutes.AccountOverview, {
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
        <Screen isScrollable={false} noHorizontalPadding noBottomPadding hasBottomInset={false}>
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
