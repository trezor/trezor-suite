import { NetworkSymbol, getNetworkOptional } from '@suite-common/wallet-config';
import { selectDeviceUnavailableCapabilities } from '@suite-common/wallet-core';
import { PROTO } from '@trezor/connect';

import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';
import { useActions } from 'src/hooks/suite/useActions';
import { useSelector } from 'src/hooks/suite/useSelector';

export const useBitcoinAmountUnit = (symbol?: NetworkSymbol) => {
    const bitcoinAmountUnit = useSelector(state => state.wallet.settings.bitcoinAmountUnit);
    const unavailableCapabilities = useSelector(selectDeviceUnavailableCapabilities);

    const { toggleBitcoinAmountUnits, setBitcoinAmountUnits } = useActions({
        toggleBitcoinAmountUnits: walletSettingsActions.toggleBitcoinAmountUnits,
        setBitcoinAmountUnits: walletSettingsActions.setBitcoinAmountUnits,
    });

    const areSatsDisplayed = bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;

    const areUnitsSupportedByDevice = !unavailableCapabilities?.amountUnit;

    const areUnitsSupportedByNetwork = getNetworkOptional(symbol)?.features.includes('amount-unit');

    return {
        bitcoinAmountUnit,
        areSatsDisplayed,
        shouldSendInSats:
            areSatsDisplayed && areUnitsSupportedByNetwork && areUnitsSupportedByDevice,
        toggleBitcoinAmountUnits,
        setBitcoinAmountUnits,
        areUnitsSupportedByNetwork,
    };
};
