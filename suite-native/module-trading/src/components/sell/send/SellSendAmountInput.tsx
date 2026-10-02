import { type Ref } from 'react';
import { type TextInput } from 'react-native';
import { useSelector } from 'react-redux';

import { selectTradingSellIsLoading } from '@suite-common/trading';
import { useWatch } from '@suite-native/forms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';

import { CRYPTO_AMOUNT_INPUT_HIT_SLOP } from '../../../constants';
import { useAmountInputDecimals } from '../../../hooks/general/useAmountInputDecimals';
import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { useSellInputFormControls } from '../../../hooks/sell/useSellInputFormControls';
import { CryptoAmountKeyboardToolbar } from '../../general/CryptoAmountKeyboardToolbar';
import { AmountInput } from '../../general/Input/AmountInput';

export type SellSendAmountInputProps = {
    showAssetsScreen: () => void;
    ref?: Ref<TextInput>;
};

const SELL_SEND_INPUT_TEST_ID = '@trading/sell/send-amount-input';

export const SellSendAmountInput = ({ showAssetsScreen, ref }: SellSendAmountInputProps) => {
    const { translate } = useTranslate();
    const { control, metadata } = useSellFormContext();
    const [asset, account, amountInCrypto, focusedValue] = useWatch({
        control,
        name: ['sendAsset', 'sendAccount', 'amountInCrypto', 'focusedValue'],
    });
    const symbol = getSymbolFromTradeableAsset(asset);
    const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
    const inputControls = useSellInputFormControls('cryptoStringAmount');
    const decimals = useAmountInputDecimals(account, asset?.contractAddress);

    const isLoading = useSelector(selectTradingSellIsLoading);

    const isAssetSelected = !!asset;
    const isToolbarVisible =
        focusedValue === 'cryptoStringAmount' || focusedValue === 'cryptoBaseCurrencyStringAmount';

    return (
        <>
            <AmountInput
                ref={ref}
                hitSlop={CRYPTO_AMOUNT_INPUT_HIT_SLOP}
                {...inputControls}
                accessibilityLabel={translate('moduleTrading.selectCoinToSell.amountLabel')}
                editable={isAssetSelected}
                inputTransformer={cryptoAmountTransformer}
                maxDecimals={decimals}
                onPress={isAssetSelected ? undefined : showAssetsScreen}
                loadingAccessibilityLabel={translate(
                    'moduleTrading.tradingScreen.quotesLoadingLabel',
                )}
                isLoading={isLoading && !amountInCrypto}
                testID={SELL_SEND_INPUT_TEST_ID}
            />
            <CryptoAmountKeyboardToolbar
                accountKey={account?.key}
                symbol={account?.symbol}
                contractAddress={asset?.contractAddress}
                decimals={decimals}
                isVisible={isToolbarVisible}
                maxSpendableAmount={metadata.maxSpendableAmount}
                onSelectAmount={amount => {
                    inputControls.onChangeText(amount);
                }}
            />
        </>
    );
};
