import {
    type TradingProviderInfo as TradingProviderInfoType,
    invityAPI,
} from '@suite-common/trading';
import { Row } from '@trezor/components';

import { TradingGetProvidersInfoProps } from 'src/types/trading/trading';
import { TradingIcon } from 'src/views/wallet/trading/common/TradingIcon';

export type TradingProviderInfoProps = {
    exchange?: string;
    providers?: TradingGetProvidersInfoProps;
    provider?: TradingProviderInfoType;
};

export const TradingProviderInfo = ({
    exchange,
    providers,
    provider,
}: TradingProviderInfoProps) => {
    const extractedProvider = provider ?? (providers && exchange ? providers[exchange] : undefined);

    return (
        <Row gap={8} data-testid="@trading/form/info/provider">
            {extractedProvider?.logo && (
                <TradingIcon iconUrl={invityAPI.getProviderLogoUrl(extractedProvider?.logo)} />
            )}
            {extractedProvider?.companyName}
        </Row>
    );
};
