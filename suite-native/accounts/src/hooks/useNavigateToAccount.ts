import { useNavigation } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { isStakingSymbol } from '@suite-common/wallet-utils';
import {
    AccountDetailStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { isNetworkWithTokens } from '@suite-native/tokens';

type NavigateToAccountParams = {
    accountKey: AccountKey;
    networkSymbol: NetworkSymbol;
};

export const useNavigateToAccount = () => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    return ({ accountKey, networkSymbol }: NavigateToAccountParams) => {
        if (isNetworkWithTokens(networkSymbol) || isStakingSymbol(networkSymbol)) {
            navigation.navigate(RootStackRoutes.AccountOverview, { accountKey });

            return;
        }

        navigation.navigate(RootStackRoutes.AccountDetailStack, {
            screen: AccountDetailStackRoutes.AccountDetail,
            params: {
                accountKey,
                closeActionType: 'back',
            },
        });
    };
};
