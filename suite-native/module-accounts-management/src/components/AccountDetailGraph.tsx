import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type FiatGraphPointWithCryptoBalance } from '@suite-common/graph';
import { type AccountsRootState, selectBaseCurrency } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import {
    type NativeAccountsRootState,
    selectAccountFiatBalance,
    selectAccountTokenFiatBalance,
} from '@suite-native/accounts';
import { VStack } from '@suite-native/atoms';
import {
    Graph,
    TimeSwitch,
    selectIsHistoryEnabledAccountByAccountKey,
    useGraphAtoms,
    useGraphForSingleAccount,
} from '@suite-native/graph';

import { AccountDetailHeader } from './AccountDetailHeader';
import { referencePointAtom, selectedPointAtom } from '../accountDetailGraphAtoms';

type AccountDetailGraphProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const AccountDetailGraph = ({ accountKey, tokenContract }: AccountDetailGraphProps) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isHistoryEnabledAccount = useSelector((state: AccountsRootState) =>
        selectIsHistoryEnabledAccountByAccountKey(state, accountKey),
    );
    const tokensFilter = useMemo(() => (tokenContract ? [tokenContract] : []), [tokenContract]);
    const { graphPoints, graphEvents, error, isLoading, refetch, onSelectTimeFrame, timeframe } =
        useGraphForSingleAccount({
            accountKey,
            baseCurrencyCode,
            tokensFilter,
            hideMainAccount: !!tokenContract,
        });
    const totalFiatBalance = useSelector((state: NativeAccountsRootState) =>
        tokenContract
            ? selectAccountTokenFiatBalance(state, accountKey, tokenContract)
            : selectAccountFiatBalance(state, accountKey, false, false),
    );

    const { handleGestureStart, setInitialSelectedPoints, setSelectedPoint } =
        useGraphAtoms<FiatGraphPointWithCryptoBalance>({
            referencePointAtom,
            selectedPointAtom,
            graphPoints,
            totalFiatBalance,
        });

    return (
        <VStack spacing="sp24">
            <AccountDetailHeader
                accountKey={accountKey}
                tokenAddress={tokenContract}
                totalFiatBalance={totalFiatBalance}
            />

            {isHistoryEnabledAccount && (
                <>
                    <Graph<FiatGraphPointWithCryptoBalance>
                        onPointSelected={setSelectedPoint}
                        onGestureEnd={setInitialSelectedPoints}
                        onGestureStart={handleGestureStart}
                        points={graphPoints}
                        loading={isLoading}
                        error={error?.message}
                        onTryAgain={refetch}
                        events={graphEvents}
                    />
                    <TimeSwitch
                        selectedTimeFrame={timeframe}
                        onSelectTimeFrame={onSelectTimeFrame}
                    />
                </>
            )}
        </VStack>
    );
};
