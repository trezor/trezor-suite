import { type YieldClaimFeeWarning, getClaimFeeWarning } from '@suite-common/earn-stablecoin';
import { type YieldAccountRewards } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { useYieldClaimFeeEstimate } from './useYieldClaimFeeEstimate';
import { useFiatFromCryptoValue } from '../../../../../hooks/suite/useFiatFromCryptoValue';

type UseYieldClaimFeeWarningParams = {
    accountRewards: YieldAccountRewards | undefined;
    networkSymbol: NetworkSymbol;
    isClaimPending: boolean;
};

export const useYieldClaimFeeWarning = ({
    accountRewards,
    networkSymbol,
    isClaimPending,
}: UseYieldClaimFeeWarningParams): YieldClaimFeeWarning | null => {
    const { fee } = useYieldClaimFeeEstimate({ accountRewards, isEnabled: !isClaimPending });

    const { fiatAmount: feeFiatAmount } = useFiatFromCryptoValue({
        amount: fee ?? '0',
        symbol: networkSymbol,
    });

    if (isClaimPending || !accountRewards || fee === null) return null;

    const totalFiatClaimableAmount = accountRewards.isTotalClaimableFiatAmountComplete
        ? accountRewards.totalClaimableFiatAmount
        : null;

    return getClaimFeeWarning({ feeFiatAmount, totalFiatClaimableAmount });
};
