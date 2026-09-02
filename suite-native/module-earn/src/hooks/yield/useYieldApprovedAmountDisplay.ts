import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type TokenSymbol } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { selectSupportedLanguageLocale } from '@suite-native/intl';

import { formatEarnTokenAmount } from '../../utils/earn/earnAmountUtils';

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
    const locale = useSelector(selectSupportedLanguageLocale);
    const hasApprovedAmount =
        allowanceAmount !== null && allowanceAmount !== undefined
            ? isPositiveBalance(allowanceAmount)
            : false;

    const formattedApprovedAmount = useMemo(() => {
        if (!hasApprovedAmount || !allowanceAmount || !tokenSymbol || isApprovedAmountUnlimited) {
            return null;
        }

        return formatEarnTokenAmount({ amount: allowanceAmount, locale, symbol: tokenSymbol });
    }, [allowanceAmount, hasApprovedAmount, isApprovedAmountUnlimited, locale, tokenSymbol]);

    return {
        formattedApprovedAmount,
        hasApprovedAmount,
    };
};
