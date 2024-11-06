import { Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import invityAPI from 'src/services/suite/invityAPI';

export interface CoinmarketProviderInfoProps {
    exchange?: string;
    providers?: {
        [name: string]: {
            logo: string;
            companyName: string;
            brandName?: string;
        };
    };
}

export const CoinmarketProviderInfo = ({ exchange, providers }: CoinmarketProviderInfoProps) => {
    const provider = providers && exchange ? providers[exchange] : null;

    return (
        <Row data-testid="@coinmarket/form/info/provider" gap={spacings.xs}>
            {!exchange && 'Unknown provider'}
            {!provider && exchange}
            {provider && (
                <>
                    {provider.logo && (
                        <img
                            width="16px"
                            src={invityAPI.getProviderLogoUrl(provider.logo)}
                            alt=""
                        />
                    )}
                    {provider.brandName || provider.companyName}
                </>
            )}
        </Row>
    );
};
