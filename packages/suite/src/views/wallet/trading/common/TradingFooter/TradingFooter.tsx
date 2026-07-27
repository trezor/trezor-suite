import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { type TradingProviderInfo, selectTradingProviderMetadata } from '@suite-common/trading';
import { Column, Link, Text } from '@trezor/components';

import { TradingFormFeesDisclaimer } from '../TradingFormFeesDisclaimer/TradingFormFeesDisclaimer';

type TradingFooterProps = {
    provider?: TradingProviderInfo;
};

export const TradingFooter = ({ provider }: TradingFooterProps) => {
    const currentProviderMetadata = useSelector(selectTradingProviderMetadata);
    const { companyName, termsUrl } = provider ?? currentProviderMetadata ?? {};

    return (
        <Column alignItems="center" margin={{ top: 48 }} gap={12}>
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                {termsUrl ? (
                    <Translation
                        id="TR_TRADING_TERMS"
                        values={{
                            provider: companyName,
                            comp: () => <Link href={termsUrl}>{companyName}</Link>,
                        }}
                    />
                ) : (
                    <Translation id="TR_TRADING_TERMS_NO_PROVIDER" />
                )}
            </Text>
            <TradingFormFeesDisclaimer />
        </Column>
    );
};
