import { InfoRow } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { CoinmarketGetProvidersInfoProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketProviderInfo } from 'src/views/wallet/coinmarket/common/CoinmarketProviderInfo';

interface CoinmarketInfoProviderProps {
    exchange: string | undefined;
    providers: CoinmarketGetProvidersInfoProps;
}

export const CoinmarketInfoProvider = ({ exchange, providers }: CoinmarketInfoProviderProps) => (
    <InfoRow label={<Translation id="TR_BUY_PROVIDER" />} direction="row">
        <CoinmarketProviderInfo exchange={exchange} providers={providers} />
    </InfoRow>
);
