import { PROTO } from '@trezor/connect';
import { useSelector } from 'src/hooks/suite/useSelector';
import { useActions } from 'src/hooks/suite/useActions';
import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';

import { NETWORKS } from 'src/config/wallet';
import { NetworkSymbol } from 'src/types/wallet';

export const useBitcoinAmountUnit = (symbol?: NetworkSymbol) => {
    const bitcoinAmountUnit = useSelector(state => state.wallet.settings.bitcoinAmountUnit);
    const unavailableCapabilities = useSelector(
        state => state.suite.device?.unavailableCapabilities,
    );

    const { toggleBitcoinAmountUnits, setBitcoinAmountUnits } = useActions({
        toggleBitcoinAmountUnits: walletSettingsActions.toggleBitcoinAmountUnits,
        setBitcoinAmountUnits: walletSettingsActions.setBitcoinAmountUnits,
    });

    const areSatsDisplayed = bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;

    const areUnitsSupportedByDevice = !unavailableCapabilities?.amountUnit;

    const areUnitsSupportedByNetwork =
        symbol &&
        NETWORKS.find(({ symbol: networkSymbol }) => networkSymbol === symbol)?.features?.includes(
            'amount-unit',
        );

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
