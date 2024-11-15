import { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';
import { useSetAtom } from 'jotai';

import { useGraphForSingleAccount, Graph, TimeSwitch } from '@suite-native/graph';
import { VStack } from '@suite-native/atoms';
import { selectFiatCurrencyCode } from '@suite-native/settings';
import { FiatGraphPointWithCryptoBalance } from '@suite-common/graph';
import { TokenAddress } from '@suite-common/wallet-types';
import { selectIsHistoryEnabledAccountByAccountKey } from '@suite-native/graph/src/selectors';
import { AccountsRootState } from '@suite-common/wallet-core';

import { AccountDetailHeader } from './AccountDetailHeader';
import { referencePointAtom, selectedPointAtom } from '../accountDetailGraphAtoms';

type AccountDetailGraphProps = {
    accountKey: string;
    tokenContract?: TokenAddress;
};

export const AccountDetailGraph = ({ accountKey, tokenContract }: AccountDetailGraphProps) => {
    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const isHistoryEnabledAccount = useSelector((state: AccountsRootState) =>
        selectIsHistoryEnabledAccountByAccountKey(state, accountKey),
    );
    const tokensFilter = useMemo(() => (tokenContract ? [tokenContract] : []), [tokenContract]);
    const { graphPoints, graphEvents, error, isLoading, refetch, onSelectTimeFrame, timeframe } =
        useGraphForSingleAccount({
            accountKey,
            fiatCurrency: fiatCurrencyCode,
            tokensFilter,
            hideMainAccount: !!tokenContract,
        });

    const setSelectedPoint = useSetAtom(selectedPointAtom);
    const setReferencePoint = useSetAtom(referencePointAtom);
    const lastPoint = A.last(graphPoints);
    const firstPoint = A.head(graphPoints);

    const setInitialSelectedPoints = useCallback(() => {
        if (lastPoint && firstPoint) {
            setSelectedPoint(lastPoint);
            setReferencePoint(firstPoint);
        }
    }, [lastPoint, firstPoint, setSelectedPoint, setReferencePoint]);

    useEffect(setInitialSelectedPoints, [setInitialSelectedPoints]);

    return (
        <VStack spacing="sp24">
            <AccountDetailHeader accountKey={accountKey} tokenAddress={tokenContract} />

            {isHistoryEnabledAccount && (
                <>
                    <Graph<FiatGraphPointWithCryptoBalance>
                        onPointSelected={setSelectedPoint}
                        onGestureEnd={setInitialSelectedPoints}
                        points={graphPoints}
                        loading={isLoading}
                        error={error}
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
