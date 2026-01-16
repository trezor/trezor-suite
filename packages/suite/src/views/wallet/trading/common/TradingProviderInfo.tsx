import { BuyProviderInfo, ExchangeProviderInfo, SellProviderInfo } from 'invity-api';

import { Translation } from '@suite/intl';
import { invityAPI } from '@suite-common/trading';
import { Row } from '@trezor/components';
import { capitalizeFirstLetter } from '@trezor/utils';

import { TradingGetProvidersInfoProps } from 'src/types/trading/trading';
import { TradingIcon } from 'src/views/wallet/trading/common/TradingIcon';

export type TradingProviderInfoProps = {
    exchange?: string;
    providers?: TradingGetProvidersInfoProps;
    provider?: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo;
};

const isBuyProviderInfo = (
    provider: BuyProviderInfo | SellProviderInfo | ExchangeProviderInfo,
): provider is BuyProviderInfo => 'brandName' in provider;

export const TradingProviderInfo = ({
    exchange,
    providers,
    provider,
}: TradingProviderInfoProps) => {
    const extractedProvider = provider ?? (providers && exchange ? providers[exchange] : undefined);

    const brandName =
        extractedProvider && isBuyProviderInfo(extractedProvider)
            ? extractedProvider.brandName
            : undefined;

    const providerName =
        brandName ??
        extractedProvider?.companyName ??
        (exchange ? capitalizeFirstLetter(exchange) : extractedProvider?.name);

    return (
        <Row gap={8} data-testid="@trading/form/info/provider">
            {providerName ? (
                <>
                    {extractedProvider?.logo && (
                        <TradingIcon
                            iconUrl={invityAPI.getProviderLogoUrl(extractedProvider?.logo)}
                        />
                    )}
                    {providerName}
                </>
            ) : (
                <Translation id="TR_TRADING_UNKNOWN_PROVIDER" />
            )}
        </Row>
    );
};
