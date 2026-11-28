import { type YieldClaimFeeWarning, getClaimFeeWarning } from '@suite-common/earn-stablecoin';
import { type YieldAccountRewards } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectFiatFromCryptoValue } from '@suite-common/wallet-core';

import { useSelector } from '#src/hooks/suite/useSelector';

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

    const feeFiatAmount = useSelector(state =>
        selectFiatFromCryptoValue(state, fee ?? '0', networkSymbol),
    );

    if (isClaimPending || !accountRewards || fee === null) return null;

    const totalFiatClaimableAmount = accountRewards.isTotalClaimableFiatAmountComplete
        ? accountRewards.totalClaimableFiatAmount
        : null;

    return getClaimFeeWarning({ feeFiatAmount, totalFiatClaimableAmount });
};
