import { Translation } from '@suite/intl';
import { type StakingNetworkType } from '@suite-common/wallet-config';
import { exhaustive } from '@trezor/type-utils';

interface EarnInANutshellWithdrawalBadgeProps {
    networkType: StakingNetworkType;
}

export const EarnInANutshellWithdrawalBadge = ({
    networkType,
}: EarnInANutshellWithdrawalBadgeProps) => {
    switch (networkType) {
        case 'cardano':
            return <Translation id="TR_TX_FEE_COUNT" values={{ count: 1 }} />;
        case 'ethereum':
        case 'solana':
            return <Translation id="TR_TX_FEE_COUNT" values={{ count: 2 }} />;
        default:
            return exhaustive(networkType);
    }
};
