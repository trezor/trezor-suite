import { HStack } from '@suite-native/atoms';
import { useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { CryptoToFiatValueBadge } from '@suite-native/trading-quote-utils';

import { ExchangeReceiveAccountCryptoBalance } from './ExchangeReceiveAccountCryptoBalance';
import { ExchangeTradeableAssetPicker } from './ExchangeTradeableAssetPicker';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useConvertFormValueToBaseUnit } from '../../../hooks/general/useConvertFormValueToBaseUnit';

export const ExchangeReceiveContent = () => {
    const { control } = useExchangeFormContext();
    const [receiveAsset, receiveCryptoAmount] = useWatch({
        name: ['receiveAsset', 'receiveCryptoAmount'],
        control,
    });
    const { convertStrToBaseUnit } = useConvertFormValueToBaseUnit();
    const receiveSymbol = getSymbolFromTradeableAsset(receiveAsset);
    const receiveCryptoAmountInBaseUnit = receiveSymbol
        ? convertStrToBaseUnit(receiveCryptoAmount, receiveSymbol)
        : receiveCryptoAmount;

    return (
        <>
            <ExchangeTradeableAssetPicker />
            <HStack justifyContent="space-between" alignItems="center" spacing="sp4">
                {!!receiveAsset?.cryptoId && (
                    <CryptoToFiatValueBadge
                        cryptoId={receiveAsset.cryptoId}
                        amount={receiveCryptoAmountInBaseUnit}
                    />
                )}
                <ExchangeReceiveAccountCryptoBalance />
            </HStack>
        </>
    );
};
