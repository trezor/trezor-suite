import { forwardRef } from 'react';
import { TextInput } from 'react-native';
import { useSelector } from 'react-redux';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';

import { MAX_CRYPTO_DECIMALS } from '../../consts/general/consts';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useBuyInputFormControls } from '../../hooks/buy/useBuyInputFormControls';
import { getSymbolFromTradeableAsset } from '../../utils/general/tradeableAssetUtils';
import { AmountInput } from '../general/Input/AmountInput';

export type CryptoAmountInputProps = {
    showAssetsSheet: () => void;
};

const CRYPTO_AMOUNT_TEST_ID = '@trading/buy/crypto-amount-input';

export const BuyCryptoAmountInput = forwardRef<TextInput, CryptoAmountInputProps>(
    ({ showAssetsSheet }, ref) => {
        const { translate } = useTranslate();
        const { watch } = useBuyFormContext();
        const [amountInCrypto, asset] = watch(['amountInCrypto', 'asset']);
        const symbol = getSymbolFromTradeableAsset(asset);
        const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
        const isLoading = useSelector(selectTradingBuyIsLoading);
        const inputControls = useBuyInputFormControls('cryptoValue');

        const isAssetSelected = !!asset;

        return (
            <AmountInput
                ref={ref}
                {...inputControls}
                accessibilityLabel={translate('moduleTrading.selectCoin.amountLabel')}
                editable={isAssetSelected}
                inputTransformer={cryptoAmountTransformer}
                maxDecimals={MAX_CRYPTO_DECIMALS}
                onPress={isAssetSelected ? undefined : showAssetsSheet}
                testID={CRYPTO_AMOUNT_TEST_ID}
                isLoading={isLoading && !amountInCrypto}
                loadingAccessibilityLabel={translate(
                    'moduleTrading.tradingScreen.quotesLoadingLabel',
                )}
            />
        );
    },
);
