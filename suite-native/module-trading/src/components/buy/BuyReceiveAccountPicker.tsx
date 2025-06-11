import { useSelector } from 'react-redux';

import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { selectBuySelectedReceiveAccount } from '../../selectors/buySelectors';
import { getSymbolFromTradeableAsset } from '../../utils/general/tradeableAssetUtils';
import { ReceiveAccountPicker } from '../general/ReceiveAccount/ReceiveAccountPicker';

const RECEIVE_ACCOUNT_PICKER_TEST_ID = '@trading/buy/receive-account';

export const BuyReceiveAccountPicker = () => {
    const { watch } = useBuyFormContext();
    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);

    const asset = watch('asset');
    const selectedSymbol = getSymbolFromTradeableAsset(asset);

    return (
        <ReceiveAccountPicker
            symbol={selectedSymbol}
            receiveAccount={selectedReceiveAccount}
            testID={RECEIVE_ACCOUNT_PICKER_TEST_ID}
        />
    );
};
