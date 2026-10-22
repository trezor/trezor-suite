import { type YieldClaimFeeWarning, getClaimFeeWarning } from '@suite-common/earn-stablecoin';
import { type YieldAccountRewards } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { useFiatFromCryptoValue } from 'src/hooks/suite/useFiatFromCryptoValue';

import { useYieldClaimFeeEstimate } from './useYieldClaimFeeEstimate';

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

    const totalFiatClaimableAmount = accountRewards.totalClaimableFiatAmount;

    return getClaimFeeWarning({ feeFiatAmount, totalFiatClaimableAmount });
};
