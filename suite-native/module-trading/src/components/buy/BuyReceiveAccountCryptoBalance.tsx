import { useWatch } from '@suite-native/forms';

import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { TradeableAssetAccountBalance } from '../general/TradeableAssetAccountBalance';

export const RECEIVE_ACCOUNT_BALANCE_TEST_ID = '@trading/buy/receive-account-balance';

export const BuyReceiveAccountCryptoBalance = () => {
    const { control } = useBuyFormContext();
    const [asset, receiveAccount] = useWatch({
        control,
        name: ['asset', 'receiveAccount'],
    });

    return (
        <TradeableAssetAccountBalance
            account={receiveAccount?.account}
            asset={asset}
            testID={RECEIVE_ACCOUNT_BALANCE_TEST_ID}
        />
    );
};
