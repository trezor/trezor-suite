import { forwardRef } from 'react';
import { type TextInput } from 'react-native';
import { useSelector } from 'react-redux';

import { selectTradingSellIsLoading } from '@suite-common/trading';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';

import { useAmountInputDecimals } from '../../../hooks/general/useAmountInputDecimals';
import { useInputFieldControls } from '../../../hooks/general/useInputFieldControls';
import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { AmountInput } from '../../general/Input/AmountInput';

export type SellSendAmountInputProps = {
    showAssetsSheet: () => void;
};

const SELL_SEND_INPUT_TEST_ID = '@trading/sell/send-amount-input';

export const SellSendAmountInput = forwardRef<TextInput, SellSendAmountInputProps>(
    ({ showAssetsSheet }, ref) => {
        const { translate } = useTranslate();
        const { watch, setValue } = useSellFormContext();
        const [asset, amount, account, amountInCrypto] = watch([
            'sendAsset',
            'cryptoStringAmount',
            'sendAccount',
            'amountInCrypto',
        ]);
        const symbol = getSymbolFromTradeableAsset(asset);
        const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
        const inputControls = useInputFieldControls('cryptoStringAmount', amount, setValue);
        const decimals = useAmountInputDecimals(account, asset?.contractAddress);
        const isLoading = useSelector(selectTradingSellIsLoading);

        const isAssetSelected = !!asset;

        return (
            <AmountInput
                ref={ref}
                {...inputControls}
                accessibilityLabel={translate('moduleTrading.selectCoinToSell.amountLabel')}
                editable={isAssetSelected}
                inputTransformer={cryptoAmountTransformer}
                maxDecimals={decimals}
                onPress={isAssetSelected ? undefined : showAssetsSheet}
                loadingAccessibilityLabel={translate(
                    'moduleTrading.tradingScreen.quotesLoadingLabel',
                )}
                isLoading={isLoading && !amountInCrypto}
                testID={SELL_SEND_INPUT_TEST_ID}
            />
        );
    },
);
