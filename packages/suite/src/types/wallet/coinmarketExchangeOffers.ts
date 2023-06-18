import type { AppState } from 'src/types/suite';
import type { Account } from 'src/types/wallet';
import type { ExchangeTrade } from 'invity-api';
import type { Timer } from '@trezor/react-utils';
import type {
    CoinmarketExchangeAction,
    ExchangeInfo,
} from 'src/actions/wallet/coinmarketExchangeActions';
import type { WithSelectedAccountLoadedProps } from 'src/components/wallet';

export type UseCoinmarketExchangeFormProps = WithSelectedAccountLoadedProps;

export type ExchangeStep = 'RECEIVING_ADDRESS' | 'SEND_TRANSACTION' | 'SEND_APPROVAL_TRANSACTION';

export type ContextValues = {
    callInProgress: boolean;
    account: Account;
    fixedQuotes: AppState['wallet']['coinmarket']['exchange']['fixedQuotes'];
    floatQuotes: AppState['wallet']['coinmarket']['exchange']['floatQuotes'];
    dexQuotes: AppState['wallet']['coinmarket']['exchange']['dexQuotes'];
    quotesRequest: AppState['wallet']['coinmarket']['exchange']['quotesRequest'];
    device: AppState['suite']['device'];
    selectedQuote?: ExchangeTrade;
    setSelectedQuote: (quote?: ExchangeTrade) => void;
    suiteReceiveAccounts?: AppState['wallet']['accounts'];
    addressVerified: AppState['wallet']['coinmarket']['exchange']['addressVerified'];
    exchangeInfo?: ExchangeInfo;
    exchangeStep: ExchangeStep;
    setExchangeStep: (step: ExchangeStep) => void;
    selectQuote: (quote: ExchangeTrade) => void;
    verifyAddress: (account: Account, address?: string, path?: string) => Promise<void>;
    receiveSymbol?: string;
    receiveAccount?: Account;
    setReceiveAccount: (account?: Account) => void;
    saveTrade: (
        exchangeTrade: ExchangeTrade,
        account: Account,
        date: string,
    ) => CoinmarketExchangeAction;
    confirmTrade: (address: string, extraField?: string) => Promise<boolean>;
    sendTransaction: () => void;
    timer: Timer;
    getQuotes: () => Promise<void>;
};
