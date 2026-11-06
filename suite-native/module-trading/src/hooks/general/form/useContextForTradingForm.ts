import { useMemo, useState } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { type TokenAddress } from '@suite-common/tokens';
import { type TradingAmountLimitProps } from '@suite-common/trading';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import { type AccountKey } from '@suite-common/wallet-types';
import { useTranslate } from '@suite-native/intl';
import { type TradingFormContext } from '@suite-native/trading-types';
import { useMaxSpendableAmount } from '@suite-native/transaction-management';

import { useConvertFormValueToBaseUnit } from '../useConvertFormValueToBaseUnit';

type UseContextForTradingFormOptions = {
    shouldReserveContractCallGas?: boolean;
};

export const useContextForTradingForm = (
    limits: TradingAmountLimitProps | undefined,
    { shouldReserveContractCallGas = false }: UseContextForTradingFormOptions = {},
) => {
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

    const isEvmNativeCoin =
        !!sendNetworkSymbol && !contractAddress && getNetworkType(sendNetworkSymbol) === 'ethereum';

    const { maxSpendableAmount } = useMaxSpendableAmount({
        accountKey,
        tokenContract: contractAddress,
        symbol: sendNetworkSymbol,
        assumeNewAccount: true,
        ethereumFixedGasLimit:
            shouldReserveContractCallGas && isEvmNativeCoin
                ? ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT
                : undefined,
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
