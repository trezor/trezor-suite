import { useSelector } from 'react-redux';

import { useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { selectBuySelectedReceiveAccount } from '@suite-native/trading-state';

import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { ReceiveAccountPicker } from '../general/ReceiveAccount/ReceiveAccountPicker';

const RECEIVE_ACCOUNT_PICKER_TEST_ID = '@trading/buy/receive-account';

export const BuyReceiveAccountPicker = () => {
    const { control } = useBuyFormContext();
    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);

    const asset = useWatch({ control, name: 'asset' });
    const selectedSymbol = getSymbolFromTradeableAsset(asset);

    return (
        <ReceiveAccountPicker
            symbol={selectedSymbol}
            receiveAccount={selectedReceiveAccount}
            tradingType="buy"
            testID={RECEIVE_ACCOUNT_PICKER_TEST_ID}
        />
    );
};
