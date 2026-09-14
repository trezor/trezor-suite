import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectNetworkConfigDeps } from '@suite-common/networks';
import { type NetworkType } from '@suite-common/wallet-config';
import { isStakingNetworkType } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { FileFilledIcon, ShieldWarningFilledIcon, WarningCircleFilledIcon } from '@trezor/icons';
import { exhaustive } from '@trezor/type-utils';

interface YieldProviderConsentBannersProps {
    networkType: NetworkType;
    providerName: string;
}

export const YieldProviderConsentBanners = ({
    networkType,
    providerName,
}: YieldProviderConsentBannersProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    if (!isStakingNetworkType(networkConfigDeps, networkType)) return null;

    switch (networkType) {
        case 'ethereum':
        case 'cardano':
        case 'solana':
            return (
                <>
                    <Banner
                        icon={FileFilledIcon}
                        intent="info"
                        description={
                            <Translation
                                id="TR_EARN_DEPOSIT_RECEIPT_TOKENS_INFO"
                                values={{ providerName }}
                            />
                        }
                    />
                    <Banner
                        icon={ShieldWarningFilledIcon}
                        intent="info"
                        description={<Translation id="TR_EARN_DEPOSIT_FULL_CONTROL_INFO" />}
                    />
                    <Banner
                        icon={WarningCircleFilledIcon}
                        intent="info"
                        description={<Translation id="TR_EARN_DEPOSIT_PROTOCOL_RISKS_INFO" />}
                    />
                </>
            );
        case 'tron':
            return null;
        default:
            return exhaustive(networkType);
    }
};
