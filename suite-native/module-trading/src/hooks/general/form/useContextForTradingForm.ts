import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { TradingAmountLimitProps } from '@suite-common/trading';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { WalletSettingsRootState, selectIsNetworkReserveEnabled } from '@suite-common/wallet-core';
import { TokenAddress } from '@suite-common/wallet-types';
import { getNetworkReserve } from '@suite-common/wallet-utils';
import { useTranslate } from '@suite-native/intl';
import { TradingFormContext } from '@suite-native/trading-types';

import { useConvertFormValueToBaseUnit } from '../useConvertFormValueToBaseUnit';

export const useContextForTradingForm = (limits: TradingAmountLimitProps | undefined) => {
    const { translate } = useTranslate();
    const { BaseCurrencyAmountFormatter, CryptoAmountFormatter } = useFormatters();
    const { convertNumberToBaseUnit } = useConvertFormValueToBaseUnit();

    const isNetworkReserveEnabled = useSelector((state: WalletSettingsRootState) =>
        selectIsNetworkReserveEnabled(state),
    );

    const [balance, setBalance] = useState<string | undefined>(undefined);
    const [sendSymbol, setSendSymbol] = useState<string | undefined>(undefined);
    const [contractAddress, setContractAddress] = useState<TokenAddress | undefined>(undefined);

    const networkReserve =
        sendSymbol && isNetworkReserveEnabled
            ? getNetworkReserve({
                  symbol: sendSymbol.toLowerCase() as NetworkSymbol,
                  contractAddress,
                  isEnabled: isNetworkReserveEnabled,
              })
            : undefined;

    const context = useMemo<TradingFormContext>(
        () => ({
            ...limits,
            sendSymbol,
            translate,
            balance: balance || undefined,
            FiatAmountFormatter: BaseCurrencyAmountFormatter,
            CryptoAmountFormatter,
            convertNumberToBaseUnit,
            networkReserve,
        }),
        [
            limits,
            sendSymbol,
            translate,
            balance,
            BaseCurrencyAmountFormatter,
            CryptoAmountFormatter,
            convertNumberToBaseUnit,
            networkReserve,
        ],
    );

    return {
        context,
        setBalance,
        setSendSymbol,
        setContractAddress,
    };
};
