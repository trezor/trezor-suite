import { useWatch } from '@suite-native/forms';

import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { TradeableAssetAccountBalance } from '../../general/TradeableAssetAccountBalance';

export const RECEIVE_ACCOUNT_BALANCE_TEST_ID = '@trading/exchange/receive-account-balance';

export const ExchangeReceiveAccountCryptoBalance = () => {
    const { control } = useExchangeFormContext();
    const [receiveAsset, receiveAccount] = useWatch({
        control,
        name: ['receiveAsset', 'receiveAccount'],
    });

    return (
        <TradeableAssetAccountBalance
            account={receiveAccount?.account}
            asset={receiveAsset}
            testID={RECEIVE_ACCOUNT_BALANCE_TEST_ID}
        />
    );
};
