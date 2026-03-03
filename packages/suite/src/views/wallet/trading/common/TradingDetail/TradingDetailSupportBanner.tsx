import { Translation } from '@suite/intl';
import {
    type TradingProviderInfo,
    type TradingTradeType,
    getStatusUrl,
    isBuyProviderInfo,
} from '@suite-common/trading';
import { Banner, Link } from '@trezor/components';

import { BannerPoints } from 'src/components/wallet/WalletLayout/AccountBanners/BannerPoints';

type TradingDetailSupportBannerProps = {
    provider?: TradingProviderInfo;
    trade?: TradingTradeType;
};

export const TradingDetailSupportBanner = ({
    provider,
    trade,
}: TradingDetailSupportBannerProps) => {
    if (!provider || !trade) {
        return null;
    }

    const providerName = isBuyProviderInfo(provider)
        ? (provider.brandName ?? provider.companyName)
        : (provider.companyName ?? provider.name);

    const { supportUrl } = provider;
    const statusUrl = getStatusUrl(provider, trade);

    if (!supportUrl && !statusUrl) {
        return null;
    }

    return (
        <Banner
            intent="neutral"
            description={
                <BannerPoints
                    points={[
                        statusUrl && (
                            <Translation
                                id="TR_TRADING_PROCESSING_STATUS"
                                values={{
                                    providerName,
                                    link: chunks => <Link href={statusUrl}>{chunks}</Link>,
                                }}
                            />
                        ),
                        supportUrl && (
                            <Translation
                                id="TR_TRADING_PROCESSING_SUPPORT"
                                values={{
                                    providerName,
                                    link: chunks => <Link href={supportUrl}>{chunks}</Link>,
                                }}
                            />
                        ),
                    ].filter(Boolean)}
                />
            }
        />
    );
};
