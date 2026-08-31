import { useMemo } from 'react';

import { useSelector } from '@suite-common/redux-utils';
import {
    type TradingAssetSellOption,
    type TradingComposedTransactionInfo,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';
import {
    type Account,
    type BaseCurrencyOption,
    type PrecomposedLevels,
    type PrecomposedLevelsCardano,
} from '@suite-common/wallet-types';
import { isErc4626, isZero } from '@suite-common/wallet-utils';

import { useTradingFiatValues } from 'src/hooks/wallet/trading/form/common/useTradingFiatValues';
import { getFeeInUnits } from 'src/utils/wallet/trading/tradingUtils';

import { useTradingAssetDecimals } from './useTradingAssetDecimals';

interface UseTradingSendAssetBalanceProps {
    account: Account | undefined;
    sendCryptoSelect: TradingAssetSellOption | undefined;
    tokenAddress: string | null | undefined;
    outputCurrency: BaseCurrencyOption | undefined;
    composedLevels: PrecomposedLevels | PrecomposedLevelsCardano | undefined;
    composedTransactionInfo: TradingComposedTransactionInfo;
}

/**
 * Send-asset read cluster shared by the sell and exchange form-input hooks:
 * the send-crypto account, its token data, zero-balance flag, network decimals,
 * fiat rates and the composed fee expressed in units.
 */
export const useTradingSendAssetBalance = ({
    account,
    sendCryptoSelect,
    tokenAddress,
    outputCurrency,
    composedLevels,
    composedTransactionInfo,
}: UseTradingSendAssetBalanceProps) => {
    const sendCryptoAccount = useSelector(state =>
        selectAccountByKey(state, sendCryptoSelect?.accountKey),
    );
    const tokenData = (sendCryptoAccount ?? account)?.tokens?.find(
        t => t.contract.toLowerCase() === tokenAddress?.toLowerCase(),
    );
    const isBalanceZero = tokenData
        ? isZero(tokenData.balance || '0')
        : isZero(account?.formattedBalance ?? '0');

    const tradingFiatValues = useTradingFiatValues({
        cryptoId: sendCryptoSelect?.id,
        amount: sendCryptoAccount?.balance,
        fiatCurrency: outputCurrency?.value || undefined,
        isErc4626: !!tokenData && isErc4626(tokenData),
    });

    const { getAssetDecimals } = useTradingAssetDecimals();
    const networkDecimals = useMemo(
        () =>
            getAssetDecimals({
                accountKey: sendCryptoSelect?.accountKey,
                cryptoId: sendCryptoSelect?.id,
            }),
        [getAssetDecimals, sendCryptoSelect?.accountKey, sendCryptoSelect?.id],
    );

    const feeInUnits = account
        ? getFeeInUnits({
              symbol: account.symbol,
              composedLevels,
              selectedFee: composedTransactionInfo?.selectedFee,
          })
        : undefined;

    return {
        sendCryptoAccount,
        tokenData,
        isBalanceZero,
        networkDecimals,
        tradingFiatValues,
        feeInUnits,
    };
};
