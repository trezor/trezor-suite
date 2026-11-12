import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { type NetworksRootState, selectNativeTokenName } from '@suite-common/networks';
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

    const nativeTokenName = useSelector((state: NetworksRootState) =>
        account?.symbol ? selectNativeTokenName(state, account.symbol) : undefined,
    );

    if (!account) return null;

    return (
        <ScreenHeader
            customContent={
                <Text variant="body-md-strong">
                    <Translation
                        id="earn.earnFormScreen.unstakeTitle"
                        values={{ displaySymbol: nativeTokenName }}
                    />
                </Text>
            }
        />
    );
};
