import { Translation } from '@suite/intl';
import { type NetworkType } from '@suite-common/wallet-config';
import { isStakingNetworkType } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

interface YieldProviderConsentBannersProps {
    networkType: NetworkType;
    providerName: string;
}

export const YieldProviderConsentBanners = ({
    networkType,
    providerName,
}: YieldProviderConsentBannersProps) => {
    if (!isStakingNetworkType(networkType)) return null;

    switch (networkType) {
        case 'ethereum':
        case 'cardano':
        case 'solana':
            return (
                <>
                    <Banner
                        icon="fileFilled"
                        intent="info"
                        description={
                            <Translation
                                id="TR_EARN_SUPPLY_RECEIPT_TOKENS_INFO"
                                values={{ providerName }}
                            />
                        }
                    />
                    <Banner
                        icon="shieldWarningFilled"
                        intent="info"
                        description={<Translation id="TR_EARN_SUPPLY_FULL_CONTROL_INFO" />}
                    />
                    <Banner
                        icon="warningCircleFilled"
                        intent="info"
                        description={<Translation id="TR_EARN_SUPPLY_PROTOCOL_RISKS_INFO" />}
                    />
                </>
            );
        default:
            return exhaustive(networkType);
    }
};
