import styled from 'styled-components';

import { type TradingUtilsProvidersProps, invityAPI } from '@suite-common/trading';
import { Row } from '@trezor/components';
import { borders, spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';

const Icon = styled.img`
    flex: none;
    max-height: 24px;
    width: auto;
    height: auto;
    border-radius: ${borders.radii.xxxs};
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
    const providerName = provider?.brandName ?? provider?.companyName;

    return (
        <Row gap={spacings.xs} className={className} data-testid="@trading/offers/quote/provider">
            {provider ? (
                <>
                    {provider.logo && (
                        <Icon src={invityAPI.getProviderLogoUrl(provider.logo)} alt="" />
                    )}
                    {providerName}
                </>
            ) : (
                <>{exchange ? exchange : <Translation id="TR_TRADING_UNKNOWN_PROVIDER" />}</>
            )}
        </Row>
    );
};
