import { useSelector } from 'react-redux';

import { BuyProviderInfo, ExchangeProviderInfo, SellProviderInfo } from 'invity-api';

import { Translation } from '@suite/intl';
import { selectTradingProviderMetadata } from '@suite-common/trading';
import { Column, Link, Text } from '@trezor/components';

import { TradingFormFeesDisclaimer } from '../TradingFormFeesDisclaimer/TradingFormFeesDisclaimer';

type TradingFooterProps = {
    provider?: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo;
};

export const TradingFooter = ({ provider }: TradingFooterProps) => {
    const currentProviderMetadata = useSelector(selectTradingProviderMetadata);
    const { companyName, termsUrl } = provider ?? currentProviderMetadata ?? {};

    const providerName = companyName ?? <Translation id="TR_TERMS_PROVIDER_PLACEHOLDER" />;

    return (
        <Column alignItems="center" margin={{ top: 48 }} gap={12}>
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation
                    id="TR_TRADING_TERMS"
                    values={{
                        provider: providerName,
                        comp: chunks =>
                            termsUrl ? <Link href={termsUrl}>{providerName}</Link> : chunks,
                    }}
                />
            </Text>
            <TradingFormFeesDisclaimer />
        </Column>
    );
};
