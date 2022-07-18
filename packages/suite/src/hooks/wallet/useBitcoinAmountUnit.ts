import { useMemo } from 'react';
import { PROTO } from '@trezor/connect';
import { useSelector } from '@suite-hooks/useSelector';
import { useActions } from '@suite-hooks/useActions';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { hasNetworkFeatures } from '@wallet-utils/accountUtils';

const UNIT_LABELS = {
    [PROTO.AmountUnit.BITCOIN]: 'Bitcoin',
    [PROTO.AmountUnit.SATOSHI]: 'Satoshis',
};

const UNIT_OPTIONS = [
    { label: UNIT_LABELS[PROTO.AmountUnit.BITCOIN], value: PROTO.AmountUnit.BITCOIN },
    { label: UNIT_LABELS[PROTO.AmountUnit.SATOSHI], value: PROTO.AmountUnit.SATOSHI },
];

export const useBitcoinAmountUnit = () => {
    const bitcoinAmountUnit = useSelector(state => state.wallet.settings.bitcoinAmountUnit);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const { toggleBitcoinAmountUnits, setBitcoinAmountUnits } = useActions({
        toggleBitcoinAmountUnits: walletSettingsActions.toggleBitcoinAmountUnits,
        setBitcoinAmountUnits: walletSettingsActions.setBitcoinAmountUnits,
    });

    const areSatsDisplayed = useMemo(
        () => bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI,
        [bitcoinAmountUnit],
    );

    const isSupportedByCurrentNetwork = useMemo(
        () =>
            selectedAccount.status === 'loaded' &&
            hasNetworkFeatures(selectedAccount.account, 'amount-unit'),
        [selectedAccount],
    );

    return {
        bitcoinAmountUnit,
        areSatsDisplayed,
        toggleBitcoinAmountUnits,
        setBitcoinAmountUnits,
        isSupportedByCurrentNetwork,
        UNIT_LABELS,
        UNIT_OPTIONS,
    };
};
