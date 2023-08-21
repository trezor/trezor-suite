import type { BankAccount, SellFiatTrade } from 'invity-api';

import type { Timer } from '@trezor/react-utils';

import type { AppState } from 'src/types/suite';
import type { Account } from 'src/types/wallet';
import type { SellInfo } from 'src/actions/wallet/coinmarketSellActions';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';

import { TradeSell } from './coinmarketCommonTypes';

export type UseOffersProps = WithSelectedAccountLoadedProps;

export type SellStep = 'BANK_ACCOUNT' | 'SEND_TRANSACTION';

export type ContextValues = {
    callInProgress: boolean;
    account: Account;
    quotes: AppState['wallet']['coinmarket']['sell']['quotes'];
    alternativeQuotes: AppState['wallet']['coinmarket']['sell']['alternativeQuotes'];
    quotesRequest: AppState['wallet']['coinmarket']['sell']['quotesRequest'];
    device: AppState['device']['device'];
    selectedQuote?: SellFiatTrade;
    trade?: TradeSell;
    suiteReceiveAccounts?: AppState['wallet']['accounts'];
    sellInfo?: SellInfo;
    sellStep: SellStep;
    setSellStep: (step: SellStep) => void;
    selectQuote: (quote: SellFiatTrade) => void;
    addBankAccount: () => void;
    confirmTrade: (bankAccount: BankAccount) => void;
    sendTransaction: () => void;
    timer: Timer;
    needToRegisterOrVerifyBankAccount: (quote: SellFiatTrade) => boolean;
    getQuotes: () => Promise<void>;
};
