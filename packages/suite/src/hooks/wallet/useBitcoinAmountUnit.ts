import { useServices } from '@suite-common/dependency-injection';
import { selectDeviceUnavailableCapabilities } from '@suite-common/device';
import { type NetworkSymbol, selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { setBitcoinAmountUnits, toggleBitcoinAmountUnits } from '@suite-common/wallet-core';
import { PROTO } from '@trezor/connect';

import { useDispatch, useSelector } from 'src/hooks/suite';

export const useBitcoinAmountUnit = (symbol?: NetworkSymbol) => {
    const { getNetworkConfig } = useServices(selectNetworkConfigDeps);
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
    const isBtcSatsAmountUnit = areSatsDisplayed && symbol === 'btc';

    const areUnitsSupportedByDevice = !unavailableCapabilities?.amountUnit;

    const areUnitsSupportedByNetwork = symbol
        ? getNetworkConfig(symbol).features.includes('amount-unit')
        : false;

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
