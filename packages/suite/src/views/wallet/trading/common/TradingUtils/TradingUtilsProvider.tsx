import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { type TradingUtilsProvidersProps, invityAPI } from '@suite-common/trading';

import { TradingIcon } from '../TradingIcon';

interface TradingUtilsProviderProps {
    exchange?: string;
    className?: string;
    providers?: TradingUtilsProvidersProps;
}

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: 1.5rem auto;
    gap: 0.75rem;
`;

const TradingIconWrapper = styled.div`
    display: flex;
    justify-content: center;
`;

export const TradingUtilsProvider = ({
    exchange,
    providers,
    className,
}: TradingUtilsProviderProps) => {
    const provider = providers && exchange ? providers[exchange] : null;
    const providerName = provider?.brandName ?? provider?.companyName;

    return (
        <Wrapper className={className} data-testid="@trading/offers/quote/provider">
            {provider ? (
                <>
                    {provider.logo && (
                        <TradingIconWrapper>
                            <TradingIcon iconUrl={invityAPI.getProviderLogoUrl(provider.logo)} />
                        </TradingIconWrapper>
                    )}
                    {providerName}
                </>
            ) : (
                <>{exchange ? exchange : <Translation id="TR_TRADING_UNKNOWN_PROVIDER" />}</>
            )}
        </Wrapper>
    );
};
