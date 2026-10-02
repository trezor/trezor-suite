import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectTradingExchangeIsLoading } from '@suite-common/trading';
import { useAlert } from '@suite-native/alerts';
import { useWatch } from '@suite-native/forms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { noop } from '@trezor/utils';

import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { AmountInput } from '../../general/Input/AmountInput';

const EXCHANGE_RECEIVE_INPUT_TEST_ID = '@trading/exchange/receive-amount-input';

export const ExchangeReceiveAmountInput = () => {
    const { translate } = useTranslate();
    const { showAlert } = useAlert();
    const isLoading = useSelector(selectTradingExchangeIsLoading);
    const { control } = useExchangeFormContext();
    const [asset, amount] = useWatch({
        control,
        name: ['receiveAsset', 'receiveCryptoAmount'],
    });
    const symbol = getSymbolFromTradeableAsset(asset);
    const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);

    const showNotAvailableAlert = useCallback(() => {
        showAlert({
            title: translate('moduleTrading.selectCoin.amountNotAvailableAlert.title'),
            description: translate('moduleTrading.selectCoin.amountNotAvailableAlert.description'),
            pictogramVariant: 'info',
            primaryButtonTitle: translate('generic.buttons.gotIt'),
            primaryButtonColorProps: { intent: 'info', priority: 'primary' },
            isClosableByOutsidePress: true,
        });
    }, [showAlert, translate]);

    return (
        <AmountInput
            value={amount}
            accessibilityLabel={translate('moduleTrading.selectCoin.amountLabel')}
            editable={false}
            inputTransformer={cryptoAmountTransformer}
            onPress={showNotAvailableAlert}
            loadingAccessibilityLabel={translate('moduleTrading.tradingScreen.quotesLoadingLabel')}
            onChangeText={noop}
            isLoading={isLoading}
            testID={EXCHANGE_RECEIVE_INPUT_TEST_ID}
        />
    );
};
