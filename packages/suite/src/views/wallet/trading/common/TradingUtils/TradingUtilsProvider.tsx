import styled from 'styled-components';

import { invityAPI } from '@suite-common/invity';
import { Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { TradingUtilsProvidersProps } from 'src/types/trading/trading';

const Icon = styled.img`
    flex: none;
    width: 20px;
    border-radius: 2px;
`;

interface TradingUtilsProviderProps {
    exchange?: string;
    className?: string;
    providers?: TradingUtilsProvidersProps;
}

export const TradingUtilsProvider = ({
    exchange,
    providers,
    className,
}: TradingUtilsProviderProps) => {
    const provider = providers && exchange ? providers[exchange] : null;

    return (
        <Row gap={spacings.xs} className={className} data-testid="@trading/offers/quote/provider">
            {provider ? (
                <>
                    {provider.logo && (
                        <Icon src={invityAPI.getProviderLogoUrl(provider.logo)} alt="" />
                    )}
                    {provider.brandName ?? provider.companyName}
                </>
            ) : (
                <>{exchange ? exchange : <Translation id="TR_TRADING_UNKNOWN_PROVIDER" />}</>
            )}
        </Row>
    );
};
