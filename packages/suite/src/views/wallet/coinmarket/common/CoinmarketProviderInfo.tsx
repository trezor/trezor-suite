import { Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import invityAPI from 'src/services/suite/invityAPI';
import { CoinmarketIcon } from 'src/views/wallet/coinmarket/common/CoinmarketIcon';

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
            {!exchange && <Translation id="TR_COINMARKET_UNKNOWN_PROVIDER" />}
            {provider ? (
                <>
                    {provider.logo && (
                        <CoinmarketIcon iconUrl={invityAPI.getProviderLogoUrl(provider.logo)} />
                    )}
                    {provider.brandName ?? provider.companyName}
                </>
            ) : (
                <Text margin={{ left: spacings.xxl }}>{exchange}</Text>
            )}
        </Row>
    );
};
