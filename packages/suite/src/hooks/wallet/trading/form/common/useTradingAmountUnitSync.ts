import { type UseFormReturn, useWatch } from 'react-hook-form';

import {
    type TRADING_FORM_CRYPTO_INPUT,
    type TRADING_FORM_OUTPUT_AMOUNT,
} from '@suite-common/trading';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import {
    asAmountSubunit,
    asAmountUnit,
    subunitsToUnits,
    unitsToSubunits,
} from '@suite-common/wallet-utils';
import { useDidUpdate } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { type TradingAllFormProps } from 'src/types/trading/tradingForm';

const bitcoinSymbol = asNetworkSymbol('btc');

type UseTradingAmountUnitSyncProps<T extends TradingAllFormProps> = {
    networkSymbol: NetworkSymbol | undefined;
    methods: UseFormReturn<T>;
    cryptoInputName: typeof TRADING_FORM_CRYPTO_INPUT | typeof TRADING_FORM_OUTPUT_AMOUNT;
};

/**
 * Keeps the crypto amount in the bitcoin unit chosen in settings (BTC / sats).
 */
export const useTradingAmountUnitSync = <T extends TradingAllFormProps>({
    networkSymbol,
    methods,
    cryptoInputName,
}: UseTradingAmountUnitSyncProps<T>) => {
    const { setValue, control } = methods as unknown as UseFormReturn<TradingAllFormProps>;
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(networkSymbol);
    const cryptoInputValue = useWatch({ control, name: cryptoInputName });

    useDidUpdate(() => {
        const amount = new BigNumber(cryptoInputValue ?? '');

        if (amount.isNaN()) {
            return;
        }

        const convertedAmount = shouldSendInSats
            ? unitsToSubunits({ value: asAmountUnit(amount), symbol: bitcoinSymbol })
            : subunitsToUnits({ value: asAmountSubunit(amount), symbol: bitcoinSymbol });

        setValue(cryptoInputName, convertedAmount.toFixed(), {
            shouldValidate: true,
            shouldDirty: true,
        });
    }, [shouldSendInSats]);
};
