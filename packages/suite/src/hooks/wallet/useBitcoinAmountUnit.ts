import { selectDeviceUnavailableCapabilities } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import { type NetworkSymbol, getNetworkOptional } from '@suite-common/wallet-config';
import {
    selectBitcoinAmountUnit,
    setBitcoinAmountUnits,
    toggleBitcoinAmountUnits,
} from '@suite-common/wallet-core';
import { PROTO } from '@trezor/connect';

import { useSelector } from 'src/hooks/suite';

export const useBitcoinAmountUnit = (symbol?: NetworkSymbol) => {
    const bitcoinAmountUnit = useSelector(selectBitcoinAmountUnit);
    const unavailableCapabilities = useSelector(selectDeviceUnavailableCapabilities);
    const dispatch = useDispatch();

    const toggleBitcoinAmountUnitsAction = () => {
        dispatch(toggleBitcoinAmountUnits());
    };

    const setBitcoinAmountUnitsAction = (unit: PROTO.AmountUnit) => {
        dispatch(setBitcoinAmountUnits(unit));
    };

    const areSatsDisplayed = bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;
    const isBtcSatsAmountUnit = areSatsDisplayed && symbol === 'btc';

    const areUnitsSupportedByDevice = !unavailableCapabilities?.amountUnit;

    const areUnitsSupportedByNetwork = getNetworkOptional(symbol)?.features.includes('amount-unit');

    return {
        bitcoinAmountUnit,
        areSatsDisplayed,
        isBtcSatsAmountUnit,
        shouldSendInSats:
            areSatsDisplayed && areUnitsSupportedByNetwork && areUnitsSupportedByDevice,
        toggleBitcoinAmountUnits: toggleBitcoinAmountUnitsAction,
        setBitcoinAmountUnits: setBitcoinAmountUnitsAction,
        areUnitsSupportedByNetwork,
    };
};
