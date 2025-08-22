import { useMemo, useState } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { TradingAmountLimitProps } from '@suite-common/trading';
import { useTranslate } from '@suite-native/intl';

import { TradingFormContext } from '../../../types/general';
import { useConvertFormValueToBaseUnit } from '../useConvertFormValueToBaseUnit';

export const useContextForTradingForm = (limits: TradingAmountLimitProps | undefined) => {
    const { translate } = useTranslate();
    const { BaseCurrencyAmountFormatter, CryptoAmountFormatter } = useFormatters();
    const { convertNumberToBaseUnit } = useConvertFormValueToBaseUnit();

    const [balance, setBalance] = useState<string | undefined>(undefined);
    const [sendSymbol, setSendSymbol] = useState<string | undefined>(undefined);

    const context = useMemo<TradingFormContext>(
        () => ({
            ...limits,
            sendSymbol,
            translate,
            balance: balance || undefined,
            FiatAmountFormatter: BaseCurrencyAmountFormatter,
            CryptoAmountFormatter,
            convertNumberToBaseUnit,
        }),
        [
            limits,
            sendSymbol,
            translate,
            balance,
            BaseCurrencyAmountFormatter,
            CryptoAmountFormatter,
            convertNumberToBaseUnit,
        ],
    );

    return {
        context,
        setBalance,
        setSendSymbol,
    };
};
