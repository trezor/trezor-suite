import { BuyProviderInfo, ExchangeProviderInfo, SellProviderInfo } from 'invity-api';

import { Banner, Link, Paragraph } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

type TradingDetailSupportBannerProps = {
    provider: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo;
    supportUrl: string;
};

const isBuyProviderInfo = (
    provider: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo,
): provider is BuyProviderInfo => 'brandName' in provider;

export const TradingDetailSupportBanner = ({
    provider,
    supportUrl,
}: TradingDetailSupportBannerProps) => {
    const providerName = isBuyProviderInfo(provider)
        ? provider.brandName
        : (provider.companyName ?? provider.name);

    return (
        <Banner intent="neutral" icon="question">
            <Paragraph typographyStyle="hint">
                <Translation
                    id="TR_TRADING_PROCESSING_SUPPORT"
                    values={{
                        providerName,
                        link: chunks => (
                            <Link href={supportUrl} target="_blank" variant="underline">
                                {chunks}
                            </Link>
                        ),
                    }}
                />
            </Paragraph>
        </Banner>
    );
};
