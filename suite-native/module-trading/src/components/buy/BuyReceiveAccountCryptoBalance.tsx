import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { TradeableAssetAccountBalance } from '../general/TradeableAssetAccountBalance';

export const RECEIVE_ACCOUNT_BALANCE_TEST_ID = '@trading/buy/receive-account-balance';

export const BuyReceiveAccountCryptoBalance = () => {
    const { watch } = useBuyFormContext();
    const [asset, receiveAccount] = watch(['asset', 'receiveAccount']);

    return (
        <TradeableAssetAccountBalance
            account={receiveAccount?.account}
            asset={asset}
            testID={RECEIVE_ACCOUNT_BALANCE_TEST_ID}
        />
    );
};
