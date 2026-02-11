import { useSelector } from 'react-redux';

import { BuyProviderInfo, ExchangeProviderInfo, SellProviderInfo } from 'invity-api';

import { Translation } from '@suite/intl';
import { selectTradingProviderMetadata } from '@suite-common/trading';
import { Column, InfoSegments, Link, Text, Tooltip } from '@trezor/components';
import { TREZOR_SUITE_TOS_URL, TREZOR_TRADING_LEARN_MORE_URL } from '@trezor/urls';

type TradingFooterProps = {
    provider?: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo;
};

export const TradingFooter = ({ provider }: TradingFooterProps) => {
    const currentProviderMetadata = useSelector(selectTradingProviderMetadata);
    const { companyName, termsUrl } = provider ?? currentProviderMetadata ?? {};

    const providerName = companyName ?? <Translation id="TR_TERMS_PROVIDER_PLACEHOLDER" />;

    return (
        <Column alignItems="center" margin={{ top: 48 }} gap={12}>
            <Text typographyStyle="hint" variant="tertiary">
                <Translation
                    id="TR_TRADING_TERMS"
                    values={{
                        provider: providerName,
                        comp: chunks =>
                            termsUrl ? <Link href={termsUrl}>{providerName}</Link> : chunks,
                    }}
                />
            </Text>

            <InfoSegments typographyStyle="hint" variant="tertiary">
                <Link href={TREZOR_SUITE_TOS_URL}>
                    <Translation id="TR_TERMS_OF_USE_TREZOR" />
                </Link>
                <Tooltip
                    content={
                        <Column gap={12}>
                            <Translation id="TR_BUY_FOOTER_TEXT_1" />
                            <Translation id="TR_BUY_FOOTER_TEXT_2" />
                        </Column>
                    }
                    cursor="default"
                >
                    <Link href={TREZOR_TRADING_LEARN_MORE_URL}>
                        <Translation id="TR_BUY_LEARN_MORE" />
                    </Link>
                </Tooltip>
            </InfoSegments>
        </Column>
    );
};
