import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenSubHeader,
    StackNavigationProps,
} from '@suite-native/navigation';
import { AccountsList } from '@suite-native/accounts';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { useTranslate } from '@suite-native/intl';

import { ReceiveAccount } from '../components/ReceiveAccount';

export const ReceiveModal = () => {
    const { translate } = useTranslate();

    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.ReceiveModal>>();

    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.ReceiveModal>>();

    const handleSelectAccount = (accountKey: AccountKey, tokenContract?: TokenAddress) => {
        navigation.dispatch({
            ...CommonActions.setParams({ accountKey, tokenContract }),
        });
    };

    // TODO: change title

    return (
        <Screen subheader={<ScreenSubHeader content={translate('moduleReceive.title')} />}>
            {route.params?.accountKey ? (
                <ReceiveAccount
                    accountKey={route.params.accountKey}
                    tokenContract={route.params?.tokenContract}
                />
            ) : (
                <AccountsList onSelectAccount={handleSelectAccount} />
            )}
        </Screen>
    );
};
