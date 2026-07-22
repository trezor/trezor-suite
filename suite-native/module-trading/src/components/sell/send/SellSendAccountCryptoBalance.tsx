import { useWatch } from '@suite-native/forms';

import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { TradeableAssetAccountBalance } from '../../general/TradeableAssetAccountBalance';

export const SEND_ACCOUNT_BALANCE_TEST_ID = '@trading/sell/send-account-balance';

export const SellSendAccountCryptoBalance = () => {
    const { control } = useSellFormContext();
    const [sendAsset, sendAccount] = useWatch({
        control,
        name: ['sendAsset', 'sendAccount'],
    });

    return (
        <TradeableAssetAccountBalance
            account={sendAccount}
            asset={sendAsset}
            testID={SEND_ACCOUNT_BALANCE_TEST_ID}
        />
    );
};
