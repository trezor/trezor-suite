import { forwardRef } from 'react';
import { type TextInput } from 'react-native';
import { useSelector } from 'react-redux';

import { selectTradingSellIsLoading } from '@suite-common/trading';
import { useWatch } from '@suite-native/forms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';

import { useAmountInputDecimals } from '../../../hooks/general/useAmountInputDecimals';
import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { useSellInputFormControls } from '../../../hooks/sell/useSellInputFormControls';
import { AmountInput } from '../../general/Input/AmountInput';

export type SellSendAmountInputProps = {
    showAssetsScreen: () => void;
};

const SELL_SEND_INPUT_TEST_ID = '@trading/sell/send-amount-input';

export const SellSendAmountInput = forwardRef<TextInput, SellSendAmountInputProps>(
    ({ showAssetsScreen }, ref) => {
        const { translate } = useTranslate();
        const { control } = useSellFormContext();
        const [asset, account, amountInCrypto] = useWatch({
            control,
            name: ['sendAsset', 'sendAccount', 'amountInCrypto'],
        });
        const symbol = getSymbolFromTradeableAsset(asset);
        const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
        const inputControls = useSellInputFormControls('cryptoStringAmount');
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
                onPress={isAssetSelected ? undefined : showAssetsScreen}
                loadingAccessibilityLabel={translate(
                    'moduleTrading.tradingScreen.quotesLoadingLabel',
                )}
                isLoading={isLoading && !amountInCrypto}
                testID={SELL_SEND_INPUT_TEST_ID}
            />
        );
    },
);
