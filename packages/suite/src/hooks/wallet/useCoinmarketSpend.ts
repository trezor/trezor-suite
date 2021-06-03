import { createContext, useContext, useEffect, useState } from 'react';
import { Props, SpendContextValues } from '@wallet-types/coinmarketSpend';
import invityAPI from '@suite-services/invityAPI';
import { SellVoucherTrade } from 'invity-api';
import { getUnusedAddressFromAccount } from '@suite/utils/wallet/coinmarket/coinmarketUtils';
import { useActions, useSelector } from '@suite-hooks';
import { useTranslation } from '@suite-hooks/useTranslation';
import * as coinmarketSellActions from '@wallet-actions/coinmarketSellActions';
import * as coinmarketSpendActions from '@wallet-actions/coinmarketSpendActions';
import * as notificationActions from '@suite-actions/notificationActions';
import { FormState } from '@wallet-types/sendForm';
import { getFeeLevels } from '@wallet-utils/sendFormUtils';
import { isDesktop } from '@suite/utils/suite/env';
import { useCompose } from './form/useCompose';
import { useForm } from 'react-hook-form';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@wallet-constants/sendForm';

export const SpendContext = createContext<SpendContextValues | null>(null);
SpendContext.displayName = 'CoinmarketSpendContext';

const useSpendState = ({ selectedAccount, fees }: Props, currentState: boolean) => {
    // do not calculate if currentState is already set (prevent re-renders)
    if (selectedAccount.status !== 'loaded' || currentState) return;

    const { account, network } = selectedAccount;
    const coinFees = fees[account.symbol];
    const levels = getFeeLevels(account.networkType, coinFees);
    const feeInfo = { ...coinFees, levels };

    return {
        account,
        network,
        feeInfo,
        formValues: {
            ...DEFAULT_VALUES,
            outputs: [],
            options: ['broadcast'],
        } as FormState, // TODO: remove type casting (options string[])
    };
};

export const useCoinmarketSpend = (props: Props): SpendContextValues => {
    const [voucherSiteUrl, setVoucherSiteUrl] = useState<string | undefined>('error');

    const { addNotification, setShowLeaveModal, saveTrade } = useActions({
        addNotification: notificationActions.addToast,
        setShowLeaveModal: coinmarketSellActions.setShowLeaveModal,
        saveTrade: coinmarketSpendActions.saveTrade,
    });
    const { translationString } = useTranslation();

    const { selectedAccount, language } = props;
    const { account } = selectedAccount;
    const { sellInfo } = useSelector(state => ({
        sellInfo: state.wallet.coinmarket.sell.sellInfo,
    }));
    const country = sellInfo?.sellList?.country;
    const isLoading = !sellInfo || !voucherSiteUrl;
    const provider = sellInfo?.sellList?.providers.filter(p => p.type === 'Voucher')[0];
    const noProviders =
        !provider ||
        !provider.tradedCoins.includes(account.symbol.toUpperCase()) ||
        !voucherSiteUrl ||
        voucherSiteUrl === 'error';

    useEffect(() => {
        if (provider) {
            if (provider.tradedCoins.includes(account.symbol.toUpperCase())) {
                setVoucherSiteUrl(undefined);
                invityAPI
                    .getVoucherQuotes({
                        country,
                        cryptoCurrency: account.symbol.toUpperCase(),
                        language,
                        refundAddress: getUnusedAddressFromAccount(account).address,
                    })
                    .then(response => {
                        if (response.length > 0) {
                            const quote = response[0];
                            if (quote.error === undefined) {
                                setVoucherSiteUrl(quote.siteUrl);
                            } else {
                                setVoucherSiteUrl('error');
                            }
                        }
                    });
            } else {
                setVoucherSiteUrl('error');
            }
        }
    }, [account, country, language, provider]);

    const [state, setState] = useState<ReturnType<typeof useSpendState>>(undefined);
    const [trade, setTrade] = useState<SellVoucherTrade | undefined>(undefined);

    // throttle initial state calculation
    const initState = useSpendState(props, !!state);
    useEffect(() => {
        if (!state && initState) {
            setState(initState);
        }
    }, [state, initState]);

    const useFormMethods = useForm<FormState>({ mode: 'onChange', shouldUnregister: false });
    const { reset, register } = useFormMethods;

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register({ name: 'outputs', type: 'custom' });
        register({ name: 'options', type: 'custom' });
    }, [register]);

    const { composeRequest, composedLevels, signTransaction } = useCompose({
        ...useFormMethods,
        state,
    });

    // react-hook-form reset, set default values
    useEffect(() => {
        reset(state?.formValues);
    }, [reset, state]);

    // when compose is finished, sign transaction or show compose error
    useEffect(() => {
        const sign = async (trade: SellVoucherTrade) => {
            const success = await signTransaction();
            if (success) {
                await invityAPI.confirmVoucherTrade(trade);
                const date = new Date().toISOString();
                saveTrade(trade, account, date);
                setShowLeaveModal(false);
            }
        };
        if (composedLevels && trade) {
            // reset trade so that it is not called multiple times
            setTrade(undefined);
            const transactionInfo = composedLevels.normal;
            if (transactionInfo.type === 'final') {
                sign(trade);
            } else {
                let errorMessage: string | undefined;
                if (transactionInfo?.type === 'error' && transactionInfo.errorMessage) {
                    errorMessage = translationString(
                        transactionInfo.errorMessage.id,
                        transactionInfo.errorMessage.values as { [key: string]: any },
                    );
                }
                if (!errorMessage) {
                    errorMessage = 'Cannot create transaction';
                }
                addNotification({
                    type: 'error',
                    error: errorMessage,
                });
            }
        }
    }, [
        addNotification,
        composedLevels,
        setShowLeaveModal,
        signTransaction,
        trade,
        translationString,
        saveTrade,
        account,
    ]);

    // create listener for messages from the spend partner
    useEffect(() => {
        if (!isLoading && !noProviders) {
            const handleMessage = async (event: MessageEvent) => {
                if (provider && provider.voucherSiteOrigin === event.origin) {
                    const trade = await invityAPI.requestVoucherTrade({
                        exchange: provider.name,
                        cryptoCurrency: account.symbol.toUpperCase(),
                        data: event.data,
                    });

                    if (trade.error) {
                        addNotification({
                            type: 'error',
                            error: trade.error,
                        });
                    }

                    if (
                        trade.status === 'SEND_CRYPTO' &&
                        !trade.error &&
                        trade.cryptoAmount &&
                        trade.destinationAddress
                    ) {
                        // initiate crypto transaction - specify outputs, initiate compose and store trade for later use
                        setState(prevState => {
                            if (prevState)
                                return {
                                    ...prevState,
                                    formValues: {
                                        ...prevState?.formValues,
                                        outputs: [
                                            {
                                                ...DEFAULT_PAYMENT,
                                                address: trade.destinationAddress || '',
                                                amount: trade.cryptoAmount?.toString() || '',
                                            },
                                        ],
                                    },
                                };
                        });
                        composeRequest();
                        setTrade(trade);
                        window.desktopApi?.windowFocus();
                    }
                }
            };

            if (isDesktop()) {
                // handle messages from desktop
                window.desktopApi?.on('spend/message', handleMessage);
                return () => {
                    window.desktopApi?.removeAllListeners('spend/message');
                };
            }

            // handle messages from web
            window.addEventListener('message', handleMessage);
            return () => {
                window.removeEventListener('message', handleMessage);
            };
        }
    }, [account.symbol, isLoading, noProviders, provider, addNotification, composeRequest]);

    const openWindow = async (voucherSiteUrl?: string) => {
        const endpointIframe = await window.desktopApi?.getHttpReceiverAddress(`/spend-iframe`);
        const handleMessageEndpoint = await window.desktopApi?.getHttpReceiverAddress(
            `/spend-handle-message`,
        );
        if (voucherSiteUrl && handleMessageEndpoint) {
            const endpointWithParams = `${endpointIframe}?voucherSiteUrl=${encodeURIComponent(
                voucherSiteUrl,
            )}&handleMessageEndpoint=${encodeURIComponent(handleMessageEndpoint)}`;
            window.open(endpointWithParams, '_blank');
        }
    };

    return {
        openWindow,
        isLoading,
        noProviders,
        provider,
        voucherSiteUrl,
        setShowLeaveModal,
    };
};

export const useCoinmarketSpendContext = () => {
    const context = useContext(SpendContext);
    if (context === null) throw Error('SpendContext used without Context');
    return context;
};
