import { HStack } from '@suite-native/atoms';
import { useWatch } from '@suite-native/forms';

import { ExchangeReceiveAccountCryptoBalance } from './ExchangeReceiveAccountCryptoBalance';
import { ExchangeTradeableAssetPicker } from './ExchangeTradeableAssetPicker';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { TradeableAssetNetworkInfo } from '../../general/TradeableAssetNetworkInfo';

export const ExchangeReceiveContent = () => {
    const { control } = useExchangeFormContext();

    const asset = useWatch({ control, name: 'receiveAsset' });

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
