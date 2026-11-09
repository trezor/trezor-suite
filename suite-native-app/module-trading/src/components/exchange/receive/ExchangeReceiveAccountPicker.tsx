import { useSelector } from 'react-redux';

import { selectTradingExchangeIsLoading } from '@suite-common/trading';
import { useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { selectExchangeSelectedReceiveAccount } from '@suite-native/trading-state';

import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { ReceiveAccountPicker } from '../../general/ReceiveAccount/ReceiveAccountPicker';

const RECEIVE_ACCOUNT_PICKER_TEST_ID = '@trading/exchange/receive-account';

export const ExchangeReceiveAccountPicker = () => {
    const { control } = useExchangeFormContext();
    const selectedReceiveAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const isLoading = useSelector(selectTradingExchangeIsLoading);

    const receiveAsset = useWatch({ name: 'receiveAsset', control });
    const quote = useWatch({ name: 'quote', control });
    const selectedSymbol = getSymbolFromTradeableAsset(receiveAsset);
    const noBottomBorder = !isLoading && !quote;

    return (
        <ReceiveAccountPicker
            symbol={selectedSymbol}
            receiveAccount={selectedReceiveAccount}
            tradingType="exchange"
            testID={RECEIVE_ACCOUNT_PICKER_TEST_ID}
            noBottomBorder={noBottomBorder}
        />
    );
};
