import { BuyProviderInfo, ExchangeProviderInfo, SellProviderInfo } from 'invity-api';

import { Translation } from '@suite/intl';
import { Banner, Link, Paragraph } from '@trezor/components';

type TradingDetailSupportBannerProps = {
    provider?: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo;
    orderId?: string;
};

const isBuyProviderInfo = (
    provider: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo,
): provider is BuyProviderInfo => 'brandName' in provider;

export const TradingDetailSupportBanner = ({
    provider,
    orderId,
}: TradingDetailSupportBannerProps) => {
    if (!provider || !orderId) {
        return null;
    }

    const providerName = isBuyProviderInfo(provider)
        ? (provider.brandName ?? provider.companyName)
        : (provider.companyName ?? provider.name);

    const supportUrlTemplate = provider.statusUrl || provider.supportUrl;
    const supportUrl = supportUrlTemplate
        ?.replace('{{orderId}}', orderId)
        ?.replace('{{paymentId}}', orderId);

    if (!supportUrl) {
        return null;
    }

    return (
        <Banner
            intent="neutral"
            icon="question"
            description={
                <Paragraph typographyStyle="body-sm">
                    <Translation
                        id="TR_TRADING_PROCESSING_SUPPORT"
                        values={{
                            providerName,
                            link: chunks => <Link href={supportUrl}>{chunks}</Link>,
                        }}
                    />
                </Paragraph>
            }
        />
    );
};
