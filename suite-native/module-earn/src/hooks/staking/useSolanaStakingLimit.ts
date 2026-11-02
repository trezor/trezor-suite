import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type BlockchainRootState,
    type SolanaStakingLimitType,
    estimateSolanaStakingLimit,
    getSolanaDeactivatedAccountCount,
    selectAccountByKey,
    selectBlockchainUrlBySymbol,
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
        account ? selectBlockchainUrlBySymbol(state, account.symbol) : undefined,
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
    const deactivatedAccountCount = account ? getSolanaDeactivatedAccountCount(account) : 0;

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
            deactivatedAccountCount,
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
        deactivatedAccountCount,
    ]);

    return limit;
};
