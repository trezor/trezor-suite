import styled from 'styled-components';

import { spacings } from '@trezor/theme';
import { Row } from '@trezor/components';
import { invityAPI } from '@suite-common/invity';

import { Translation } from 'src/components/suite';
import { CoinmarketUtilsProvidersProps } from 'src/types/coinmarket/coinmarket';

const Icon = styled.img`
    flex: none;
    width: 20px;
    border-radius: 2px;
`;

interface CoinmarketUtilsProviderProps {
    exchange?: string;
    className?: string;
    providers?: CoinmarketUtilsProvidersProps;
}

export const CoinmarketUtilsProvider = ({
    exchange,
    providers,
    className,
}: CoinmarketUtilsProviderProps) => {
    const provider = providers && exchange ? providers[exchange] : null;

    return (
        <Row
            gap={spacings.xs}
            className={className}
            data-testid="@coinmarket/offers/quote/provider"
        >
            {provider ? (
                <>
                    {provider.logo && (
                        <Icon src={invityAPI.getProviderLogoUrl(provider.logo)} alt="" />
                    )}
                    {provider.brandName ?? provider.companyName}
                </>
            ) : (
                <>{exchange ? exchange : <Translation id="TR_COINMARKET_UNKNOWN_PROVIDER" />}</>
            )}
        </Row>
    );
};
