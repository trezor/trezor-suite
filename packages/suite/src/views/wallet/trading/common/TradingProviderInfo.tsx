import {
    type TradingProviderInfo as TradingProviderInfoType,
    tradeApi,
} from '@suite-common/trading';
import { Row } from '@trezor/components';

import { TradingIcon } from './TradingIcon';
import { type TradingGetProvidersInfoProps } from '../../../../types/trading/trading';

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
                <TradingIcon iconUrl={tradeApi.getProviderLogoUrl(extractedProvider?.logo)} />
            )}
            {extractedProvider?.companyName}
        </Row>
    );
};
