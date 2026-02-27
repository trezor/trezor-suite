import { Translation } from '@suite/intl';
import { StakingNetworkType } from '@suite-common/wallet-config';
import { exhaustive } from '@trezor/type-utils';

interface EarnInANutshellWithdrawalBadgeProps {
    networkType: StakingNetworkType;
}

export const EarnInANutshellWithdrawalBadge = ({
    networkType,
}: EarnInANutshellWithdrawalBadgeProps) => {
    switch (networkType) {
        case 'cardano':
            return <Translation id="TR_TX_FEE" />;
        case 'ethereum':
        case 'solana':
            return (
                <>
                    <Translation id="TR_TX_CONFIRMATIONS" values={{ confirmationsCount: 2 }} />{' '}
                    <Translation id="TR_TX_FEE" />
                </>
            );
        default:
            return exhaustive(networkType);
    }
};
