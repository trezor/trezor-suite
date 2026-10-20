import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { type TradingUtilsProvidersProps, tradeApi } from '@suite-common/trading';
import { Column, Image, Row } from '@trezor/components';
import { type SpacingValue } from '@trezor/theme';

type TradingUtilsProviderProps = {
    exchange?: string;
    providers?: TradingUtilsProvidersProps;
    subtitle?: ReactNode;
    iconMaxHeight?: number;
    gap?: SpacingValue;
};

export const TradingUtilsProvider = ({
    exchange,
    providers,
    subtitle,
    iconMaxHeight = 24,
    gap = 12,
}: TradingUtilsProviderProps) => {
    const provider = providers && exchange ? providers[exchange] : null;
    const providerName = provider?.brandName ?? provider?.companyName;

    const name = (
        <span data-testid="@trading/offers/quote/provider">
            {provider ? (
                providerName
            ) : (
                <>{exchange ? exchange : <Translation id="TR_TRADING_UNKNOWN_PROVIDER" />}</>
            )}
        </span>
    );

    return (
        <Row gap={gap}>
            <Row width={iconMaxHeight} flex="none" justifyContent="center">
                {!!provider?.logo && (
                    <Image
                        imageSrc={tradeApi.getProviderLogoUrl(provider.logo)}
                        maxHeight={iconMaxHeight}
                        borderRadius={4}
                    />
                )}
            </Row>
            {subtitle ? (
                <Column alignItems="flex-start" gap={0}>
                    {name}
                    {subtitle}
                </Column>
            ) : (
                name
            )}
        </Row>
    );
};
