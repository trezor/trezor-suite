import { InfoItem } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { TradingGetProvidersInfoProps } from 'src/types/trading/trading';
import { TradingProviderInfo } from 'src/views/wallet/trading/common/TradingProviderInfo';

interface TradingInfoProviderProps {
    exchange: string | undefined;
    providers: TradingGetProvidersInfoProps;
}

export const TradingInfoProvider = ({ exchange, providers }: TradingInfoProviderProps) => (
    <InfoItem label={<Translation id="TR_BUY_PROVIDER" />} direction="row">
        <TradingProviderInfo exchange={exchange} providers={providers} />
    </InfoItem>
);
