import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { TradeableAssetAccountBalance } from '../../general/TradeableAssetAccountBalance';

export const SEND_ACCOUNT_BALANCE_TEST_ID = '@trading/exchange/send-account-balance';

export const ExchangeSendAccountCryptoBalance = () => {
    const { watch } = useExchangeFormContext();
    const [sendAsset, sendAccount] = watch(['sendAsset', 'sendAccount']);

    return (
        <TradeableAssetAccountBalance
            account={sendAccount}
            asset={sendAsset}
            testID={SEND_ACCOUNT_BALANCE_TEST_ID}
        />
    );
};
