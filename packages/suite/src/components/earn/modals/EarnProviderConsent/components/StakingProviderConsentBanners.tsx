import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkConfigDeps } from '@suite-common/networks';
import { type NetworkType } from '@suite-common/wallet-config';
import { isStakingNetworkType } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { FileFilledIcon, ShieldWarningFilledIcon } from '@trezor/icons';
import { exhaustive } from '@trezor/type-utils';

interface StakingProviderConsentBannersProps {
    networkType: NetworkType;
    displaySymbol: string;
}

export const StakingProviderConsentBanners = ({
    networkType,
    displaySymbol,
}: StakingProviderConsentBannersProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    if (!isStakingNetworkType(networkConfigDeps, networkType)) return null;

    switch (networkType) {
        case 'ethereum':
            return (
                <>
                    <Banner
                        icon={FileFilledIcon}
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
                        icon={ShieldWarningFilledIcon}
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
                        icon={FileFilledIcon}
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
                        icon={ShieldWarningFilledIcon}
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
        case 'tron':
            return null;
        default:
            return exhaustive(networkType);
    }
};
