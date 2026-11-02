import { Translation } from '@suite/intl';
import { type YieldAccountRewards } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Banner } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

import { useYieldClaimFeeWarning } from './hooks';

type YieldClaimFeeWarningProps = {
    accountRewards: YieldAccountRewards | undefined;
    networkSymbol: NetworkSymbol;
    isClaimPending: boolean;
};

export const YieldClaimFeeWarning = ({
    accountRewards,
    networkSymbol,
    isClaimPending,
}: YieldClaimFeeWarningProps) => {
    const claimFeeWarning = useYieldClaimFeeWarning({
        accountRewards,
        networkSymbol,
        isClaimPending,
    });

    if (claimFeeWarning !== 'fee-exceeds-rewards') return null;

    return (
        <Banner
            data-testid="@yield/claim/fee-warning"
            intent="warning"
            icon={WarningIcon}
            description={<Translation id="TR_EARN_REWARDS_NETWORK_FEE_WARNING" />}
        />
    );
};
