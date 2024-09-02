import { Row } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { CoinmarketGetProvidersInfoProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketInfoLeftColumn, CoinmarketInfoRightColumn } from 'src/views/wallet/coinmarket';
import { CoinmarketProviderInfo } from 'src/views/wallet/coinmarket/common/CoinmarketProviderInfo';

interface CoinmarketInfoProviderProps {
    exchange: string | undefined;
    providers: CoinmarketGetProvidersInfoProps;
}

export const CoinmarketInfoProvider = ({ exchange, providers }: CoinmarketInfoProviderProps) => (
    <Row>
        <CoinmarketInfoLeftColumn>
            <Translation id="TR_BUY_PROVIDER" />
        </CoinmarketInfoLeftColumn>
        <CoinmarketInfoRightColumn>
            <CoinmarketProviderInfo exchange={exchange} providers={providers} />
        </CoinmarketInfoRightColumn>
    </Row>
);
