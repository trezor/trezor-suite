import { useSelector } from 'react-redux';

import { selectTradingExchangeIsLoading } from '@suite-common/trading';

import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { selectExchangeSelectedReceiveAccount } from '../../../selectors/exchangeSelectors';
import { getSymbolFromTradeableAsset } from '../../../utils/general/tradeableAssetUtils';
import { ReceiveAccountPicker } from '../../general/ReceiveAccount/ReceiveAccountPicker';

const RECEIVE_ACCOUNT_PICKER_TEST_ID = '@trading/exchange/receive-account';

export const ExchangeReceiveAccountPicker = () => {
    const { watch } = useExchangeFormContext();
    const selectedReceiveAccount = useSelector(selectExchangeSelectedReceiveAccount);
    const isLoading = useSelector(selectTradingExchangeIsLoading);

    const [asset, quote] = watch(['receiveAsset', 'quote']);
    const selectedSymbol = getSymbolFromTradeableAsset(asset);
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
