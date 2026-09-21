import { type UseFormReturn, useWatch } from 'react-hook-form';

import {
    type TRADING_FORM_CRYPTO_INPUT,
    type TRADING_FORM_OUTPUT_AMOUNT,
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
} from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import {
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
} from '@suite-common/wallet-utils';
import { useDidUpdate } from '@trezor/react-utils';

import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { type TradingAllFormProps } from 'src/types/trading/tradingForm';

import { useTradingAssetDecimals } from './useTradingAssetDecimals';

type UseTradingAmountUnitSyncProps<T extends TradingAllFormProps> = {
    account: Account | undefined;
    methods: UseFormReturn<T>;
    cryptoInputName: typeof TRADING_FORM_CRYPTO_INPUT | typeof TRADING_FORM_OUTPUT_AMOUNT;
};

/**
 * Keeps the crypto amount in the bitcoin unit chosen in settings (BTC / sats).
 */
export const useTradingAmountUnitSync = <T extends TradingAllFormProps>({
    account,
    methods,
    cryptoInputName,
}: UseTradingAmountUnitSyncProps<T>) => {
    const { setValue, getValues, control } =
        methods as unknown as UseFormReturn<TradingAllFormProps>;
    const { isBtcSatsAmountUnit: shouldSendInSats } = useBitcoinAmountUnit(account?.symbol);
    const cryptoInputValue = useWatch({ control, name: cryptoInputName });
    const sendCryptoSelect = getValues(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT);
    const { getAssetDecimals } = useTradingAssetDecimals();
    const networkDecimals = getAssetDecimals({
        accountKey: sendCryptoSelect?.accountKey,
        cryptoId: sendCryptoSelect?.id,
    });

    useDidUpdate(() => {
        const conversion = shouldSendInSats
            ? convertAmountUnitsToSubunits
            : convertAmountSubunitsToUnits;

        if (!cryptoInputValue) {
            return;
        }

        setValue(cryptoInputName, conversion(cryptoInputValue, networkDecimals), {
            shouldValidate: true,
            shouldDirty: true,
        });
    }, [shouldSendInSats]);
};
