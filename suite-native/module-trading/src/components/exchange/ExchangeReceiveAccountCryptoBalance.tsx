import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { getSymbolFromTradeableAsset } from '../../utils/general/tradeableAssetUtils';
import { ReceiveAccountCryptoBalance } from '../general/ReceiveAccount/ReceiveAccountCryptoBalance';

export const RECEIVE_ACCOUNT_BALANCE_TEST_ID = '@trading/exchange/receive-account-balance';

export const ExchangeReceiveAccountCryptoBalance = () => {
    const { watch } = useExchangeFormContext();
    const [receiveAsset, receiveAccount] = watch(['receiveAsset', 'receiveAccount']);
    const selectedSymbol = getSymbolFromTradeableAsset(receiveAsset);

    return (
        <ReceiveAccountCryptoBalance
            account={receiveAccount?.account}
            defaultSymbol={selectedSymbol}
            testID={RECEIVE_ACCOUNT_BALANCE_TEST_ID}
        />
    );
};
