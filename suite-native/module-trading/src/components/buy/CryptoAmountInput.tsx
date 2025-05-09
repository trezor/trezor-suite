import { forwardRef } from 'react';
import { TextInput } from 'react-native';
import { useSelector } from 'react-redux';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { BoxSkeleton } from '@suite-native/atoms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';

import { MAX_CRYPTO_DECIMALS } from '../../consts';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { getSelectedSymbolFromBuyForm } from '../../utils/tradeableAssetUtils';
import {
    MAX_INPUT_HEIGHT,
    MIN_INPUT_WIDTH,
    TradingAmountInput,
} from '../general/TradingAmountInput';

export type CryptoAmountInputProps = {
    showAssetsSheet: () => void;
};

const CRYPTO_AMOUNT_TEST_ID = '@trading/buy/crypto-amount-input';

export const CryptoAmountInput = forwardRef<TextInput, CryptoAmountInputProps>(
    ({ showAssetsSheet }, ref) => {
        const { translate } = useTranslate();
        const form = useTradingBuyFormContext();
        const symbol = getSelectedSymbolFromBuyForm(form);
        const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
        const isLoading = useSelector(selectTradingBuyIsLoading);

        const amountInCrypto = form.watch('amountInCrypto');
        const isAssetSelected = !!form.watch('asset');

        if (isLoading && !amountInCrypto) {
            return (
                <BoxSkeleton
                    height={MAX_INPUT_HEIGHT}
                    width={MIN_INPUT_WIDTH}
                    accessibilityLabel={translate('moduleTrading.tradingScreen.quotesLoadingLabel')}
                />
            );
        }

        return (
            <TradingAmountInput
                ref={ref}
                name="cryptoValue"
                accessibilityLabel={translate('moduleTrading.selectCoin.amountLabel')}
                editable={isAssetSelected}
                inputTransformer={cryptoAmountTransformer}
                maxDecimals={MAX_CRYPTO_DECIMALS}
                onPress={isAssetSelected ? undefined : showAssetsSheet}
                testID={CRYPTO_AMOUNT_TEST_ID}
            />
        );
    },
);
