import { HStack } from '@suite-native/atoms';

import { ExchangeReceiveAccountCryptoBalance } from './ExchangeReceiveAccountCryptoBalance';
import { ExchangeTradeableAssetPicker } from './ExchangeTradeableAssetPicker';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { TradeableAssetNetworkInfo } from '../../general/TradeableAssetNetworkInfo';

export const ExchangeReceiveContent = () => {
    const { watch } = useExchangeFormContext();

    const asset = watch('receiveAsset');

    return (
        <>
            <ExchangeTradeableAssetPicker />
            <HStack justifyContent="space-between" alignItems="center" spacing="sp4">
                <TradeableAssetNetworkInfo asset={asset} />
                <ExchangeReceiveAccountCryptoBalance />
            </HStack>
        </>
    );
};
