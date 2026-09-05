import { useMemo, useState } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { type TradingAmountLimitProps } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { useTranslate } from '@suite-native/intl';
import { type TradingFormContext } from '@suite-native/trading-types';
import { useMaxSpendableAmount } from '@suite-native/transaction-management';

import { useConvertFormValueToBaseUnit } from '../useConvertFormValueToBaseUnit';

export const useContextForTradingForm = (limits: TradingAmountLimitProps | undefined) => {
    const { translate } = useTranslate();

    const { BaseCurrencyAmountFormatter, CryptoAmountFormatter } = useFormatters();
    const { convertNumberToBaseUnit } = useConvertFormValueToBaseUnit();

    const [balance, setBalance] = useState<string | undefined>(undefined);
    const [sendNetworkSymbol, setSendNetworkSymbol] = useState<NetworkSymbol | undefined>(
        undefined,
    );
    const [sendAssetSymbol, setSendAssetSymbol] = useState<string | undefined>(undefined);
    const [contractAddress, setContractAddress] = useState<TokenAddress | undefined>(undefined);
    const [accountKey, setAccountKey] = useState<AccountKey | undefined>(undefined);

    const { maxSpendableAmount } = useMaxSpendableAmount({
        accountKey,
        tokenContract: contractAddress,
        symbol: sendNetworkSymbol,
    });

    const context = useMemo<TradingFormContext>(
        () => ({
            ...limits,
            sendNetworkSymbol,
            sendAssetSymbol,
            contractAddress,
            translate,
            balance: balance || undefined,
            FiatAmountFormatter: BaseCurrencyAmountFormatter,
            CryptoAmountFormatter,
            convertNumberToBaseUnit,
            maxSpendableAmount,
        }),
        [
            limits,
            sendNetworkSymbol,
            sendAssetSymbol,
            contractAddress,
            translate,
            balance,
            BaseCurrencyAmountFormatter,
            CryptoAmountFormatter,
            convertNumberToBaseUnit,
            maxSpendableAmount,
        ],
    );

    return {
        context,
        setBalance,
        setSendNetworkSymbol,
        setSendAssetSymbol,
        setContractAddress,
        setAccountKey,
    };
};
