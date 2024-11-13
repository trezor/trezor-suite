import { useDispatch } from 'react-redux';
import { RefreshControl } from 'react-native';
import { useMemo, useState, useCallback } from 'react';

import { RouteProp, useRoute } from '@react-navigation/native';

import { RootStackParamList, RootStackRoutes, Screen } from '@suite-native/navigation';
import { initStakeDataThunk } from '@suite-common/wallet-core';
import { useNativeStyles } from '@trezor/styles';

import { StakingDetailScreenHeader } from '../components/StakingDetailScreenHeader';
import { StakingInfo } from '../components/StakingInfo';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const StakingDetailScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.StakingDetail>>();
    const { accountKey } = route.params;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { utils } = useNativeStyles();

    const dispatch = useDispatch();

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await dispatch(initStakeDataThunk());
        // sleep little bit because it's too fast
        await sleep(1000);
        setIsRefreshing(false);
    }, [dispatch]);

    const refreshControl = useMemo(
        () => (
            <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[utils.colors.backgroundPrimaryDefault]}
            />
        ),
        [isRefreshing, handleRefresh, utils.colors],
    );

    return (
        <Screen screenHeader={<StakingDetailScreenHeader />} refreshControl={refreshControl}>
            <StakingInfo accountKey={accountKey} />
        </Screen>
    );
};
