import { useSelector } from 'react-redux';

import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { selectExchangeSelectedReceiveAccount } from '../../../selectors/exchangeSelectors';
import { getSymbolFromTradeableAsset } from '../../../utils/general/tradeableAssetUtils';
import { ReceiveAccountPicker } from '../../general/ReceiveAccount/ReceiveAccountPicker';

const RECEIVE_ACCOUNT_PICKER_TEST_ID = '@trading/exchange/receive-account';

export const ExchangeReceiveAccountPicker = () => {
    const { watch } = useExchangeFormContext();
    const selectedReceiveAccount = useSelector(selectExchangeSelectedReceiveAccount);

    const asset = watch('receiveAsset');
    const selectedSymbol = getSymbolFromTradeableAsset(asset);

    return (
        <ReceiveAccountPicker
            symbol={selectedSymbol}
            receiveAccount={selectedReceiveAccount}
            tradingType="exchange"
            testID={RECEIVE_ACCOUNT_PICKER_TEST_ID}
        />
    );
};
