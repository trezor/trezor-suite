import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import type { SellFiatTrade } from 'invity-api';

import {
    type TradingRootState,
    type TradingSellType,
    isFinalStatus,
    selectTradingCoinInfoByCryptoId,
    selectTradingProviderMetadata,
    selectTradingSellSelectedQuote,
    useTradingDetailData,
} from '@suite-common/trading';
import { selectSendPrecomposedTx } from '@suite-common/wallet-core';

import { useComposeSellTransactionWhenRequired } from './useComposeSellTransactionWhenRequired';
import { useSellBankAccountVerificationOnMount } from './useSellBankAccountVerificationOnMount';
import { useSellFlow } from './useSellFlow';
import { useClearTradingStateOnUnmount } from '../general/useClearTradingStateOnUnmount';
import { useWatchTrade } from '../general/useWatchTrade';

type SellCompletionScreenControls =
    | { hasRequiredData: false }
    | {
          hasRequiredData: true;
          quote: SellFiatTrade;
          companyName: string;
          cryptoSymbol: string;
          errorString: ReactNode;
          shouldShowConfirmButton: boolean;
          shouldShowFee: boolean;
      };

export const useSellCompletionScreenControls = (): SellCompletionScreenControls => {
    const { trade } = useTradingDetailData<TradingSellType>('sell');
    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const providerMetadata = useSelector(selectTradingProviderMetadata);
    const precomposedTransaction = useSelector(selectSendPrecomposedTx);

    const currentQuote = trade?.data ?? selectedQuote;
    const coinInfo = useSelector((state: TradingRootState) =>
        selectTradingCoinInfoByCryptoId(state, currentQuote?.cryptoCurrency),
    );

    const { txnErrorString, doBankAccountVerificationCheck, composeTradingTransaction } =
        useSellFlow();

    useWatchTrade({
        accountKey: trade?.sendAccountKey,
        orderId: currentQuote?.orderId,
        isInProgress: true,
    });

    useSellBankAccountVerificationOnMount({
        doBankAccountVerificationCheck,
    });

    useComposeSellTransactionWhenRequired({
        orderId: currentQuote?.orderId,
        status: currentQuote?.status,
        composeTradingTransaction,
    });

    useClearTradingStateOnUnmount();

    if (!currentQuote || !providerMetadata) {
        return { hasRequiredData: false };
    }

    const shouldSendCrypto = currentQuote.status === 'SEND_CRYPTO';
    const errorString = txnErrorString ?? currentQuote.error;
    const isTransactionReady = shouldSendCrypto && precomposedTransaction?.type === 'final';
    const shouldShowConfirmButton =
        !isFinalStatus('sell', currentQuote.status) && isTransactionReady && !errorString;

    return {
        hasRequiredData: true,
        quote: currentQuote,
        companyName: providerMetadata.companyName,
        cryptoSymbol: coinInfo?.symbol?.toUpperCase() ?? '',
        errorString,
        shouldShowConfirmButton,
        shouldShowFee: shouldSendCrypto,
    };
};
