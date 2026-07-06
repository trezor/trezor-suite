import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useAtomValue } from 'jotai';

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
    accountDetailGraphAtoms,
    refetchAccountGraphThunk,
    selectIsHistoryEnabledAccountByAccountKey,
    useAccountGraphData,
    useGraphAtoms,
} from '@suite-native/graph';

import { AccountDetailGraphTimeSwitch } from './AccountDetailGraphTimeSwitch';
import { AccountDetailHeader } from './AccountDetailHeader';

type AccountDetailGraphProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const AccountDetailGraph = ({ accountKey, tokenContract }: AccountDetailGraphProps) => {
    const dispatch = useDispatch();
    const isHistoryEnabledAccount = useSelector((state: AccountsRootState) =>
        selectIsHistoryEnabledAccountByAccountKey(state, accountKey),
    );
    const totalFiatBalance = useSelector((state: NativeAccountsRootState) =>
        tokenContract
            ? selectAccountTokenFiatBalance(state, accountKey, tokenContract)
            : selectAccountFiatBalance(state, accountKey, false, false),
    );

    useAccountGraphData({ accountKey, tokenContract });

    const graphPoints = useAtomValue(accountDetailGraphAtoms.graphPointsAtom);
    const isLoading = useAtomValue(accountDetailGraphAtoms.isLoadingAtom);
    const error = useAtomValue(accountDetailGraphAtoms.errorAtom);
    const graphEvents = useAtomValue(accountDetailGraphAtoms.graphEventsAtom);

    const { handleGestureStart, setInitialSelectedPoints, setSelectedPoint } =
        useGraphAtoms<FiatGraphPointWithCryptoBalance>({
            referencePointAtom: accountDetailGraphAtoms.referencePointAtom,
            selectedPointAtom: accountDetailGraphAtoms.selectedPointAtom,
            graphPoints,
            totalFiatBalance,
        });

    const isTokenPriceUnavailable = !isLoading && (!!error || graphPoints.length <= 1);
    const isGraphHidden = !!tokenContract && isTokenPriceUnavailable;

    const handleTryAgain = useCallback(() => {
        dispatch(refetchAccountGraphThunk({ accountKey, tokenContract, forceRefetch: true }));
    }, [dispatch, accountKey, tokenContract]);

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
                        onGestureEnd={setInitialSelectedPoints}
                        onGestureStart={handleGestureStart}
                        points={graphPoints}
                        loading={isLoading}
                        error={error?.message}
                        onTryAgain={handleTryAgain}
                        events={graphEvents}
                    />
                    <AccountDetailGraphTimeSwitch accountKey={accountKey} />
                </>
            )}
        </VStack>
    );
};
