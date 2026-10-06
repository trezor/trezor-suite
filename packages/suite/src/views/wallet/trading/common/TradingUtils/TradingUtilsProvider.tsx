import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type TradingUtilsProvidersProps, tradeApi } from '@suite-common/trading';
import { Column, Image } from '@trezor/components';

type TradingUtilsProviderProps = {
    exchange?: string;
    className?: string;
    providers?: TradingUtilsProvidersProps;
    subtitle?: ReactNode;
    iconMaxHeight?: number;
};

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: 2rem auto;
    align-items: center;
    gap: 12px;
`;

const TradingIconWrapper = styled.div`
    display: flex;
    justify-content: center;
`;

export const TradingUtilsProvider = ({
    exchange,
    providers,
    className,
    subtitle,
    iconMaxHeight = 24,
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
        <Wrapper className={className}>
            <TradingIconWrapper>
                {!!provider?.logo && (
                    <Image
                        imageSrc={tradeApi.getProviderLogoUrl(provider.logo)}
                        maxHeight={iconMaxHeight}
                        borderRadius={4}
                    />
                )}
            </TradingIconWrapper>
            {subtitle ? (
                <Column alignItems="flex-start" gap={0}>
                    {name}
                    {subtitle}
                </Column>
            ) : (
                name
            )}
        </Wrapper>
    );
};
