import { invityAPI } from '@suite-common/trading';
import { Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { TradingIcon } from 'src/views/wallet/trading/common/TradingIcon';

export interface TradingProviderInfoProps {
    exchange?: string;
    providers?: {
        [name: string]: {
            logo: string;
            companyName: string;
            brandName?: string;
        };
    };
}

export const TradingProviderInfo = ({ exchange, providers }: TradingProviderInfoProps) => {
    const provider = providers && exchange ? providers[exchange] : null;

    return (
        <Row data-testid="@trading/form/info/provider" gap={spacings.xs}>
            {!exchange && <Translation id="TR_TRADING_UNKNOWN_PROVIDER" />}
            {provider ? (
                <>
                    {provider.logo && (
                        <TradingIcon iconUrl={invityAPI.getProviderLogoUrl(provider.logo)} />
                    )}
                    {provider.brandName ?? provider.companyName}
                </>
            ) : (
                <Text margin={{ left: spacings.xxl }}>{exchange}</Text>
            )}
        </Row>
    );
};
