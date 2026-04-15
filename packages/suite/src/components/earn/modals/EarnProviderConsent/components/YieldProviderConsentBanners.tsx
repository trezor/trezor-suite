import { Translation } from '@suite/intl';
import { type NetworkType } from '@suite-common/wallet-config';
import { isStakingNetworkType } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

interface YieldProviderConsentBannersProps {
    networkType: NetworkType;
    displaySymbol: string;
    providerName: string;
}

export const YieldProviderConsentBanners = ({
    networkType,
    displaySymbol,
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
                                id="TR_EARN_SUPPLY_PROVIDER_MANAGES"
                                values={{
                                    providerName,
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
                                id="TR_EARN_SUPPLY_PROVIDER_NO_LIABILITY"
                                values={{ providerName }}
                            />
                        }
                    />
                    <Banner
                        icon="warningCircleFilled"
                        intent="info"
                        description={
                            <Translation
                                id="TR_EARN_SUPPLY_PROVIDER_SMART_CONTRACT_RISK"
                                values={{ providerName }}
                            />
                        }
                    />
                </>
            );
        default:
            return exhaustive(networkType);
    }
};
