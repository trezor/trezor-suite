import { selectDeviceUnavailableCapabilities } from '@suite-common/device';
import { type NetworkSymbol, getNetworkOptional } from '@suite-common/wallet-config';
import { setBitcoinAmountUnits, toggleBitcoinAmountUnits } from '@suite-common/wallet-core';
import { PROTO } from '@trezor/connect';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const useBitcoinAmountUnit = (symbol?: NetworkSymbol) => {
    const bitcoinAmountUnit = useSelector(state => state.wallet.settings.bitcoinAmountUnit);
    const unavailableCapabilities = useSelector(selectDeviceUnavailableCapabilities);
    const dispatch = useDispatch();

    const toggleBitcoinAmountUnitsAction = () => {
        dispatch(toggleBitcoinAmountUnits());
    };

    const setBitcoinAmountUnitsAction = (unit: PROTO.AmountUnit) => {
        dispatch(setBitcoinAmountUnits(unit));
    };

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
