import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useDispatch } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { Context } from '@suite-common/message-system';
import { initStakeDataThunk } from '@suite-common/wallet-core';
import { isStakingSymbol, parseAccountKey } from '@suite-common/wallet-utils';
import { ContextMessage } from '@suite-native/message-system';
import { type RootStackParamList, type RootStackRoutes, Screen } from '@suite-native/navigation';
import { useNativeStyles } from '@trezor/styles-native';
import { resolveAfter } from '@trezor/utils';

import { StakingDetailScreenHeader } from '../components/StakingDetailScreenHeader';
import { StakingInfo } from '../components/StakingInfo';

export const StakingDetailScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.StakingDetail>>();
    const { accountKey } = route.params;
    const { networkSymbol } = parseAccountKey(accountKey);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { utils } = useNativeStyles();

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(initStakeDataThunk());
    }, [dispatch]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await dispatch(initStakeDataThunk());
        // sleep little bit because it's too fast
        await resolveAfter(1000);
        setIsRefreshing(false);
    }, [dispatch]);

    const refreshControl = useMemo(
        () => (
            <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[utils.colors.legacyBackgroundPrimaryDefault]}
            />
        ),
        [isRefreshing, handleRefresh, utils.colors],
    );

    return (
        <Screen header={<StakingDetailScreenHeader />} refreshControl={refreshControl}>
            {isStakingSymbol(networkSymbol) && (
                <ContextMessage context={Context.getStaking(networkSymbol)} />
            )}
            <StakingInfo accountKey={accountKey} />
        </Screen>
    );
};
