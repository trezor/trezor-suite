import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { getSymbolFromTradeableAsset } from '../../../utils/general/tradeableAssetUtils';
import { ReceiveAccountCryptoBalance } from '../../general/ReceiveAccount/ReceiveAccountCryptoBalance';

export const SEND_ACCOUNT_BALANCE_TEST_ID = '@trading/exchange/send-account-balance';

export const ExchangeSendAccountCryptoBalance = () => {
    const { watch } = useExchangeFormContext();
    const [sendAsset, sendAccount] = watch(['sendAsset', 'sendAccount']);
    const selectedSymbol = getSymbolFromTradeableAsset(sendAsset);

    return (
        <ReceiveAccountCryptoBalance
            account={sendAccount}
            defaultSymbol={selectedSymbol}
            testID={SEND_ACCOUNT_BALANCE_TEST_ID}
        />
    );
};
