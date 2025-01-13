import { useNavigation } from '@react-navigation/native';

import { AccountsList, AddAccountButton, OnSelectAccount } from '@suite-native/accounts';
import { useTranslate } from '@suite-native/intl';
import {
    ReceiveStackParamList,
    ReceiveStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    ReceiveStackParamList,
    ReceiveStackRoutes.ReceiveAccounts,
    RootStackParamList
>;

export const ReceiveAccountsScreen = () => {
    const { translate } = useTranslate();
    const navigation = useNavigation<NavigationProps>();

    const navigateToReceiveScreen: OnSelectAccount = ({ account, tokenAddress }) =>
        navigation.navigate(RootStackRoutes.ReceiveModal, {
            accountKey: account.key,
            tokenContract: tokenAddress,
            closeActionType: 'back',
        });

    return (
        <Screen
            header={
                <ScreenHeader
                    content={translate('moduleReceive.receiveTitle')}
                    rightIcon={<AddAccountButton flowType="receive" />}
                    closeActionType="close"
                />
            }
        >
            <AccountsList onSelectAccount={navigateToReceiveScreen} hideTokensIntoModal />
        </Screen>
    );
};
