import { useMemo } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';

type UseYieldApprovedAmountDisplayParams = {
    allowanceAmount: string | null | undefined;
    isApprovedAmountUnlimited: boolean;
    tokenSymbol: TokenSymbol | null | undefined;
};

export const useYieldApprovedAmountDisplay = ({
    allowanceAmount,
    isApprovedAmountUnlimited,
    tokenSymbol,
}: UseYieldApprovedAmountDisplayParams) => {
    const { CryptoAmountFormatter } = useFormatters();
    const hasApprovedAmount =
        allowanceAmount !== null && allowanceAmount !== undefined
            ? isPositiveBalance(allowanceAmount)
            : false;

    const formattedApprovedAmount = useMemo(() => {
        if (!hasApprovedAmount || !allowanceAmount || !tokenSymbol || isApprovedAmountUnlimited) {
            return null;
        }

        return CryptoAmountFormatter.format(allowanceAmount, {
            symbol: tokenSymbol,
            isBalance: true,
            withSymbol: true,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
    }, [
        CryptoAmountFormatter,
        allowanceAmount,
        hasApprovedAmount,
        isApprovedAmountUnlimited,
        tokenSymbol,
    ]);

    return {
        formattedApprovedAmount,
        hasApprovedAmount,
    };
};
