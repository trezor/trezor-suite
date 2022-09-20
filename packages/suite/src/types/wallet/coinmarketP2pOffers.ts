import type { AppState } from '@suite-types';
import type { Account } from '@wallet-types';
import type { Timer } from '@trezor/react-utils';
import { WithSelectedAccountLoadedProps } from '@wallet-components';
import { P2pProviderInfo, P2pQuote, P2pQuotesRequest } from 'invity-api';

export type UseOffersProps = WithSelectedAccountLoadedProps;

export enum P2pStep {
    GET_STARTED,
    RECEIVING_ADDRESS,
}

export type ContextValues = {
    device: AppState['suite']['device'];
    account: Account;
    providers?: { [name: string]: P2pProviderInfo };
    timer: Timer;
    quotesRequest?: P2pQuotesRequest;
    quotes?: P2pQuote[];
    selectQuote: (quote: P2pQuote) => void;
    selectedQuote?: P2pQuote;
    p2pStep: P2pStep;
    goToProvider: () => void;
    providerVisited: boolean;
    goToReceivingAddress: () => void;
    callInProgress: boolean;
};
