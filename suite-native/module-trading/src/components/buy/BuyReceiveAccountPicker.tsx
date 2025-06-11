import { useSelector } from 'react-redux';

import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { selectBuySelectedReceiveAccount } from '../../selectors/buySelectors';
import { getSelectedSymbolFromBuyForm } from '../../utils/general/tradeableAssetUtils';
import { ReceiveAccountPicker } from '../general/ReceiveAccount/ReceiveAccountPicker';

const RECEIVE_ACCOUNT_PICKER_TEST_ID = '@trading/buy/receive-account';

export const BuyReceiveAccountPicker = () => {
    const selectedReceiveAccount = useSelector(selectBuySelectedReceiveAccount);
    const form = useBuyFormContext();

    const selectedSymbol = getSelectedSymbolFromBuyForm(form);

    return (
        <ReceiveAccountPicker
            symbol={selectedSymbol}
            receiveAccount={selectedReceiveAccount}
            testID={RECEIVE_ACCOUNT_PICKER_TEST_ID}
        />
    );
};
