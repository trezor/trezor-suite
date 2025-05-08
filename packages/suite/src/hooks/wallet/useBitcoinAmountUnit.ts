import { NetworkSymbol, getNetworkOptional } from '@suite-common/wallet-config';
import {
    selectDeviceUnavailableCapabilities,
    setBitcoinAmountUnits,
    toggleBitcoinAmountUnits,
} from '@suite-common/wallet-core';
import { PROTO } from '@trezor/connect';

import { useActions } from 'src/hooks/suite/useActions';
import { useSelector } from 'src/hooks/suite/useSelector';

export const useBitcoinAmountUnit = (symbol?: NetworkSymbol) => {
    const bitcoinAmountUnit = useSelector(state => state.wallet.settings.bitcoinAmountUnit);
    const unavailableCapabilities = useSelector(selectDeviceUnavailableCapabilities);

    const { toggleBitcoinAmountUnitsAction, setBitcoinAmountUnitsAction } = useActions({
        toggleBitcoinAmountUnitsAction: toggleBitcoinAmountUnits,
        setBitcoinAmountUnitsAction: setBitcoinAmountUnits,
    });

    const areSatsDisplayed = bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;

    const areUnitsSupportedByDevice = !unavailableCapabilities?.amountUnit;

    const areUnitsSupportedByNetwork = getNetworkOptional(symbol)?.features.includes('amount-unit');

    return {
        bitcoinAmountUnit,
        areSatsDisplayed,
        shouldSendInSats:
            areSatsDisplayed && areUnitsSupportedByNetwork && areUnitsSupportedByDevice,
        toggleBitcoinAmountUnits: toggleBitcoinAmountUnitsAction,
        setBitcoinAmountUnits: setBitcoinAmountUnitsAction,
        areUnitsSupportedByNetwork,
    };
};
