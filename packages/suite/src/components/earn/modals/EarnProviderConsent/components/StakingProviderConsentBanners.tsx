import { Translation } from '@suite/intl';
import { type NetworkType } from '@suite-common/wallet-config';
import { isStakingNetworkType } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

interface StakingProviderConsentBannersProps {
    networkType: NetworkType;
    displaySymbol: string;
}

export const StakingProviderConsentBanners = ({
    networkType,
    displaySymbol,
}: StakingProviderConsentBannersProps) => {
    if (!isStakingNetworkType(networkType)) return null;

    switch (networkType) {
        case 'ethereum':
            return (
                <>
                    <Banner
                        icon="fileFilled"
                        intent="info"
                        description={
                            <Translation
                                id="TR_EARN_STAKE_EVERSTAKE_MANAGES"
                                values={{
                                    networkDisplaySymbol: displaySymbol,
                                    t: text => <strong>{text}</strong>,
                                }}
                            />
                        }
                    />
                    <Banner
                        icon="shieldWarningFilled"
                        intent="info"
                        description={<Translation id="TR_EARN_STAKE_TREZOR_NO_LIABILITY" />}
                    />
                </>
            );
        case 'cardano':
        case 'solana':
            return (
                <>
                    <Banner
                        icon="fileFilled"
                        intent="info"
                        description={
                            <Translation
                                id="TR_EARN_BY_STAKING_YOU_CAN_EARN_REWARDS"
                                values={{
                                    networkDisplaySymbol: displaySymbol,
                                    t: text => <strong>{text}</strong>,
                                }}
                            />
                        }
                    />
                    <Banner
                        icon="shieldWarningFilled"
                        intent="info"
                        description={
                            <Translation
                                id="TR_EARN_SECURELY_DELEGATE_TO_EVERSTAKE"
                                values={{ symbol: displaySymbol }}
                            />
                        }
                    />
                </>
            );
        default:
            return exhaustive(networkType);
    }
};
