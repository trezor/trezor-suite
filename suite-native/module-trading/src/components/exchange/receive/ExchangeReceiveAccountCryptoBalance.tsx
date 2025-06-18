import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { TradeableAssetAccountBalance } from '../../general/TradeableAssetAccountBalance';

export const RECEIVE_ACCOUNT_BALANCE_TEST_ID = '@trading/exchange/receive-account-balance';

export const ExchangeReceiveAccountCryptoBalance = () => {
    const { watch } = useExchangeFormContext();
    const [receiveAsset, receiveAccount] = watch(['receiveAsset', 'receiveAccount']);

    return (
        <TradeableAssetAccountBalance
            account={receiveAccount?.account}
            asset={receiveAsset}
            testID={RECEIVE_ACCOUNT_BALANCE_TEST_ID}
        />
    );
};
