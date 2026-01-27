import { Translation } from '@suite/intl';
import { NetworkType } from '@suite-common/wallet-config';
import { isStakingNetworkType } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

interface EarnInANutshellWithdrawalBadgeProps {
    networkType: NetworkType;
}

export const EarnInANutshellWithdrawalBadge = ({
    networkType,
}: EarnInANutshellWithdrawalBadgeProps) => {
    if (!isStakingNetworkType(networkType)) return null;

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
