import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type FiatGraphPointWithCryptoBalance } from '@suite-common/graph';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import {
    type NativeAccountsRootState,
    selectAccountFiatBalance,
    selectAccountTokenFiatBalance,
} from '@suite-native/accounts';
import { VStack } from '@suite-native/atoms';
import {
    Graph,
    type GraphSliceRootState,
    accountDetailGraphAtoms,
    getAccountGraphInstanceId,
    resetGraphRuntimeState,
    selectAccountGraphError,
    selectAccountGraphEvents,
    selectAccountGraphIsLoading,
    selectAccountGraphPoints,
    selectAccountGraphTimeframe,
    selectIsHistoryEnabledAccountByAccountKey,
    useGraphData,
    useGraphGestureHandlers,
} from '@suite-native/graph';

import { AccountDetailGraphTimeSwitch } from './AccountDetailGraphTimeSwitch';
import { AccountDetailHeader } from './AccountDetailHeader';
import { selectAccountItemForGraph } from '../selectors';

type AccountDetailGraphProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const AccountDetailGraph = ({ accountKey, tokenContract }: AccountDetailGraphProps) => {
    const dispatch = useDispatch();
    const graphInstanceId = getAccountGraphInstanceId({ accountKey, tokenContract });

    const isHistoryEnabledAccount = useSelector((state: AccountsRootState) =>
        selectIsHistoryEnabledAccountByAccountKey(state, accountKey),
    );
    const accountGraphTimeframe = useSelector((state: GraphSliceRootState) =>
        selectAccountGraphTimeframe(state, accountKey, tokenContract),
    );
    const totalFiatBalance = useSelector((state: NativeAccountsRootState) =>
        tokenContract
            ? selectAccountTokenFiatBalance(state, accountKey, tokenContract)
            : selectAccountFiatBalance(state, accountKey, false, false),
    );
    const accountItem = useSelector((state: AccountsRootState) =>
        selectAccountItemForGraph(state, accountKey, tokenContract),
    );
    const accounts = useMemo(() => (accountItem ? [accountItem] : undefined), [accountItem]);

    const { refetchGraph: refetchAccountGraph } = useGraphData({
        instanceId: graphInstanceId,
        accounts,
        eventsAccount: accountItem,
        timeframeHours: accountGraphTimeframe,
        backendSymbol: accountItem?.symbol ?? 'btc',
    });

    const graphPoints = useSelector((state: GraphSliceRootState) =>
        selectAccountGraphPoints(state, accountKey, tokenContract),
    );
    const isLoading = useSelector((state: GraphSliceRootState) =>
        selectAccountGraphIsLoading(state, accountKey, tokenContract),
    );
    const error = useSelector((state: GraphSliceRootState) =>
        selectAccountGraphError(state, accountKey, tokenContract),
    );
    const graphEvents = useSelector((state: GraphSliceRootState) =>
        selectAccountGraphEvents(state, accountKey, tokenContract),
    );

    const { setSelectedPoint, handleGestureEnd } = useGraphGestureHandlers(
        accountDetailGraphAtoms.selectedPointAtom,
    );

    useEffect(
        () => () => {
            dispatch(resetGraphRuntimeState({ instanceId: graphInstanceId }));
        },
        [dispatch, graphInstanceId],
    );

    const isTokenPriceUnavailable = !isLoading && (!!error || graphPoints.length <= 1);
    const isGraphHidden = !!tokenContract && isTokenPriceUnavailable;

    const handleTryAgain = useCallback(() => {
        refetchAccountGraph({ forceRefetch: true });
    }, [refetchAccountGraph]);

    return (
        <VStack spacing="sp24">
            <AccountDetailHeader
                accountKey={accountKey}
                tokenAddress={tokenContract}
                totalFiatBalance={totalFiatBalance}
                graphPoints={graphPoints}
            />

            {isHistoryEnabledAccount && !isGraphHidden && (
                <>
                    <Graph<FiatGraphPointWithCryptoBalance>
                        onPointSelected={setSelectedPoint}
                        onGestureEnd={handleGestureEnd}
                        points={graphPoints}
                        loading={isLoading}
                        error={error}
                        onTryAgain={handleTryAgain}
                        events={graphEvents}
                    />
                    <AccountDetailGraphTimeSwitch
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                </>
            )}
        </VStack>
    );
};
