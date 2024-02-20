import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { P2pQuote } from 'invity-api';

import { useTimer } from '@trezor/react-utils';
import { selectDevice } from '@suite-common/wallet-core';

import { ContextValues, P2pStep, UseOffersProps } from 'src/types/wallet/coinmarketP2pOffers';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { InvityAPIReloadQuotesAfterSeconds } from 'src/constants/wallet/coinmarket/metadata';
import { openCoinmarketP2pConfirmModal } from 'src/actions/wallet/coinmarketP2pActions';
import invityAPI from 'src/services/suite/invityAPI';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import { submitRequestForm } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';

export const useOffers = ({ selectedAccount }: UseOffersProps): ContextValues => {
    const timer = useTimer();

    const device = useSelector(selectDevice);
    const providers = useSelector(state => state.wallet.coinmarket.p2p.p2pInfo?.providers);
    const quotesRequest = useSelector(state => state.wallet.coinmarket.p2p.quotesRequest);
    const quotes = useSelector(state => state.wallet.coinmarket.p2p.quotes);
    const dispatch = useDispatch();

    const { account } = selectedAccount;
    const [selectedQuote, setSelectedQuote] = useState<P2pQuote>();
    const { navigateToP2pForm } = useCoinmarketNavigation(account);
    const [innerQuotes, setInnerQuotes] = useState(quotes);
    const [callInProgress, setCallInProgress] = useState(false);
    const [providerVisited, setProviderVisited] = useState(false);
    const [p2pStep, setP2pStep] = useState(P2pStep.GET_STARTED);

    const getQuotes = useCallback(async () => {
        if (!selectedQuote && quotesRequest) {
            timer.loading();
            const response = await invityAPI.getP2pQuotes(quotesRequest);

            if (!response || response.quotes?.length === 0) {
                timer.stop();

                return;
            }

            setInnerQuotes(response.quotes);
            timer.reset();
        }
    }, [selectedQuote, quotesRequest, timer]);

    useEffect(() => {
        if (!quotesRequest) {
            navigateToP2pForm();

            return;
        }

        if (!timer.isLoading && !timer.isStopped) {
            if (timer.resetCount >= 40) {
                timer.stop();
            }

            if (timer.timeSpend.seconds === InvityAPIReloadQuotesAfterSeconds) {
                getQuotes();
            }
        }
    });

    const selectQuote = async (quote: P2pQuote) => {
        const provider = providers ? providers[quote.provider] : null;
        if (await dispatch(openCoinmarketP2pConfirmModal(provider?.companyName, quote.assetCode))) {
            setSelectedQuote(quote);
            timer.stop();
        }
    };

    const goToProvider = async () => {
        if (!quotesRequest || !selectedQuote) {
            return;
        }

        setCallInProgress(true);

        const response = await invityAPI.doP2pTrade({
            quotesRequest,
            selectedQuote,
        });

        setCallInProgress(false);

        if (response && response.tradeForm) {
            dispatch(submitRequestForm(response.tradeForm.form));
            setProviderVisited(true);
        }
    };

    const goToReceivingAddress = () => {
        setP2pStep(P2pStep.RECEIVING_ADDRESS);
        setProviderVisited(false);
    };

    return {
        device,
        account,
        providers,
        timer,
        quotesRequest,
        quotes: innerQuotes,
        selectQuote,
        selectedQuote,
        p2pStep,
        goToProvider,
        callInProgress,
        providerVisited,
        goToReceivingAddress,
    };
};

export const CoinmarketP2pOffersContext = createContext<ContextValues | null>(null);
CoinmarketP2pOffersContext.displayName = 'CoinmarketP2pOffersContext';

export const useCoinmarketP2pOffersContext = () => {
    const context = useContext(CoinmarketP2pOffersContext);
    if (context === null) throw Error('CoinmarketP2pOffersContext used without Context');

    return context;
};
