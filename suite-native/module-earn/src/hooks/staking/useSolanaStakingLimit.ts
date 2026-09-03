import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type SolanaStakingLimitType,
    estimateSolanaStakingLimit,
    getSolanaDeactivatedRentReserves,
} from '@suite-common/staking';
import {
    type AccountsRootState,
    type BlockchainRootState,
    selectAccountByKey,
    selectNetworkBlockchainInfo,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { asAmountUnit, formatNetworkAmount, unitsToSubunits } from '@suite-common/wallet-utils';
import { useDebouncedValue } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

const NO_LIMIT = { isLimitExceeded: false, formattedAmount: '0' };

type UseSolanaStakingLimitParams = {
    accountKey: AccountKey;
    type: SolanaStakingLimitType;
    amount: string | undefined;
};

export const useSolanaStakingLimit = ({
    accountKey,
    type,
    amount,
}: UseSolanaStakingLimitParams) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const blockchainUrl = useSelector((state: BlockchainRootState) =>
        account ? selectNetworkBlockchainInfo(state, account.symbol)?.url : undefined,
    );
    const isSolanaAccount = account?.networkType === 'solana';
    const descriptor = account?.descriptor;
    const symbol = account?.symbol;

    const outputAmount = useMemo(() => {
        if (!symbol) return undefined;

        const value = new BigNumber(amount ?? '');
        if (!value.isFinite() || value.lte(0)) return undefined;

        return unitsToSubunits({ value: asAmountUnit(value), symbol }).toFixed(0);
    }, [amount, symbol]);

    const debouncedOutputAmount = useDebouncedValue(outputAmount);
    const deactivatedRentReservesKey = useMemo(
        () => (account ? getSolanaDeactivatedRentReserves(account).join(',') : ''),
        [account],
    );
    const deactivatedRentReserves = useMemo(
        () => (deactivatedRentReservesKey ? deactivatedRentReservesKey.split(',') : []),
        [deactivatedRentReservesKey],
    );

    const [limit, setLimit] = useState(NO_LIMIT);

    useEffect(() => {
        if (
            !isSolanaAccount ||
            !descriptor ||
            !symbol ||
            !blockchainUrl ||
            !debouncedOutputAmount
        ) {
            setLimit(NO_LIMIT);

            return;
        }

        let isActive = true;

        estimateSolanaStakingLimit({
            descriptor,
            deactivatedRentReserves,
            blockchainUrl,
            userAgent: 'Trezor Suite',
            type,
            outputAmount: debouncedOutputAmount,
        })
            .then(resolved => {
                if (!isActive) {
                    return;
                }

                setLimit({
                    isLimitExceeded: resolved.isLimitExceeded,
                    formattedAmount: formatNetworkAmount(resolved.estimatedAmount, symbol),
                });
            })
            .catch(() => {
                if (isActive) {
                    setLimit(NO_LIMIT);
                }
            });

        return () => {
            isActive = false;
        };
    }, [
        descriptor,
        symbol,
        isSolanaAccount,
        blockchainUrl,
        debouncedOutputAmount,
        type,
        deactivatedRentReserves,
    ]);

    return limit;
};
