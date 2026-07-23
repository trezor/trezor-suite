import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useAtomValue, useSetAtom } from 'jotai';

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
    selectAccountGraphIsLoading,
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
    const resetGraph = useSetAtom(accountDetailGraphAtoms.resetGraphAtom);
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

    const graphPoints = useAtomValue(accountDetailGraphAtoms.graphPointsAtom);
    const isLoading = useSelector((state: GraphSliceRootState) =>
        selectAccountGraphIsLoading(state, accountKey, tokenContract),
    );
    const error = useSelector((state: GraphSliceRootState) =>
        selectAccountGraphError(state, accountKey, tokenContract),
    );
    const graphEvents = useAtomValue(accountDetailGraphAtoms.graphEventsAtom);

    const { setSelectedPoint, handleGestureEnd } = useGraphGestureHandlers(
        accountDetailGraphAtoms.selectedPointAtom,
    );

    useEffect(
        () => () => {
            dispatch(resetGraphRuntimeState({ instanceId: graphInstanceId }));
            resetGraph();
        },
        [dispatch, graphInstanceId, resetGraph],
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
