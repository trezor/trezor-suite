import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { getSymbolFromTradeableAsset } from '../../utils/general/tradeableAssetUtils';
import { ReceiveAccountCryptoBalance } from '../general/ReceiveAccount/ReceiveAccountCryptoBalance';

export const RECEIVE_ACCOUNT_BALANCE_TEST_ID = '@trading/buy/receive-account-balance';

export const BuyReceiveAccountCryptoBalance = () => {
    const { watch } = useBuyFormContext();
    const [asset, receiveAccount] = watch(['asset', 'receiveAccount']);
    const selectedSymbol = getSymbolFromTradeableAsset(asset);

    return (
        <ReceiveAccountCryptoBalance
            account={receiveAccount?.account}
            defaultSymbol={selectedSymbol}
            testID={RECEIVE_ACCOUNT_BALANCE_TEST_ID}
        />
    );
};
