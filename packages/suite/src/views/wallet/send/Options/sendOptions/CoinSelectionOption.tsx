import { sendOptionFields } from './sendFormFields';
import { useCoinSelectionToggle } from './useCoinSelectionToggle';
import { useSendOption } from './useSendOption';
import { CoinControl } from '../CoinControl/CoinControl';

/** Picking the coins a UTXO transaction spends. */
export const CoinSelectionOption = () => {
    const { isEnabled } = useSendOption(sendOptionFields.coinSelection.option);
    const toggleCoinSelection = useCoinSelectionToggle();

    return isEnabled ? <CoinControl close={toggleCoinSelection} /> : null;
};
