import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    type RootStackRoutes,
    ScreenHeader,
} from '@suite-native/navigation';

export const UnstakeFlowScreenHeader = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.UnstakeFlow>>();
    const { accountKey } = route.params;
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) return null;

    const displaySymbol = getNetworkDisplaySymbolName(account.symbol);

    return (
        <ScreenHeader
            customContent={
                <Text variant="body-md-strong">
                    <Translation id="earn.earnFormScreen.unstakeTitle" values={{ displaySymbol }} />
                </Text>
            }
        />
    );
};
