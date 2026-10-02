import { type Ref } from 'react';
import { type TextInput } from 'react-native';
import { useSelector } from 'react-redux';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { useWatch } from '@suite-native/forms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { MAX_CRYPTO_DECIMALS } from '@suite-native/trading-consts';

import { CRYPTO_AMOUNT_INPUT_HIT_SLOP } from '../../constants';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useBuyInputFormControls } from '../../hooks/buy/useBuyInputFormControls';
import { AmountInput } from '../general/Input/AmountInput';

export type CryptoAmountInputProps = {
    showAssetsSheet: () => void;
    ref?: Ref<TextInput>;
};

const CRYPTO_AMOUNT_TEST_ID = '@trading/buy/crypto-amount-input';

export const BuyCryptoAmountInput = ({ showAssetsSheet, ref }: CryptoAmountInputProps) => {
    const { translate } = useTranslate();
    const { control } = useBuyFormContext();
    const [amountInCrypto, asset] = useWatch({
        control,
        name: ['amountInCrypto', 'asset'],
    });
    const symbol = getSymbolFromTradeableAsset(asset);
    const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
    const isLoading = useSelector(selectTradingBuyIsLoading);
    const inputControls = useBuyInputFormControls('cryptoValue');

    const isAssetSelected = !!asset;

    return (
        <AmountInput
            ref={ref}
            hitSlop={CRYPTO_AMOUNT_INPUT_HIT_SLOP}
            {...inputControls}
            accessibilityLabel={translate('moduleTrading.selectCoin.amountLabel')}
            editable={isAssetSelected}
            inputTransformer={cryptoAmountTransformer}
            maxDecimals={MAX_CRYPTO_DECIMALS}
            onPress={isAssetSelected ? undefined : showAssetsSheet}
            testID={CRYPTO_AMOUNT_TEST_ID}
            isLoading={isLoading && !amountInCrypto}
            loadingAccessibilityLabel={translate('moduleTrading.tradingScreen.quotesLoadingLabel')}
        />
    );
};
