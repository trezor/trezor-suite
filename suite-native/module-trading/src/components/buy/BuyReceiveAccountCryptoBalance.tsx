import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { getSelectedSymbolFromBuyForm } from '../../utils/general/tradeableAssetUtils';
import { ReceiveAccountCryptoBalance } from '../general/ReceiveAccount/ReceiveAccountCryptoBalance';

export const RECEIVE_ACCOUNT_BALANCE_TEST_ID = '@trading/buy/receive-account-balance';

export const BuyReceiveAccountCryptoBalance = () => {
    const form = useBuyFormContext();
    const selectedSymbol = getSelectedSymbolFromBuyForm(form);
    const receiveAccount = form.watch('receiveAccount');

    return (
        <ReceiveAccountCryptoBalance
            account={receiveAccount?.account}
            defaultSymbol={selectedSymbol}
            testID={RECEIVE_ACCOUNT_BALANCE_TEST_ID}
        />
    );
};
