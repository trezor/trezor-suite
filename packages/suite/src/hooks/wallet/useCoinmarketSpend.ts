import { createContext, useContext, useEffect, useState } from 'react';
import { desktopApi } from '@trezor/suite-desktop-api';
import { UseCoinmarketSpendProps, SpendContextValues } from '@wallet-types/coinmarketSpend';
import invityAPI from '@suite-services/invityAPI';
import { SellVoucherTrade } from 'invity-api';
import { getUnusedAddressFromAccount } from '@suite/utils/wallet/coinmarket/coinmarketUtils';
import { useActions, useSelector } from '@suite-hooks';
import { useTranslation } from '@suite-hooks/useTranslation';
import * as coinmarketSellActions from '@wallet-actions/coinmarketSellActions';
import * as coinmarketSpendActions from '@wallet-actions/coinmarketSpendActions';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as notificationActions from '@suite-actions/notificationActions';
import type { FormState } from '@wallet-types/sendForm';
import { amountToSatoshi, getFeeLevels } from '@suite-common/wallet-utils';
import { isDesktop } from '@suite-utils/env';
import { useCompose } from './form/useCompose';
import { useForm } from 'react-hook-form';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import type { AppState } from '@suite-types';
import { useBitcoinAmountUnit } from '@wallet-hooks/useBitcoinAmountUnit';

export const SpendContext = createContext<SpendContextValues | null>(null);
SpendContext.displayName = 'CoinmarketSpendContext';

const useSpendState = (
    selectedAccount: UseCoinmarketSpendProps['selectedAccount'],
    fees: AppState['wallet']['fees'],
    currentState: boolean,
) => {
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
            selectedUtxos: [],
        } as FormState, // TODO: remove type casting (options string[])
    };
};

export const useCoinmarketSpend = ({
    selectedAccount,
}: UseCoinmarketSpendProps): SpendContextValues => {
    const [voucherSiteUrl, setVoucherSiteUrl] = useState<string | undefined>('error');

    const { addNotification, setShowLeaveModal, saveTrade, loadInvityData } = useActions({
        addNotification: notificationActions.addToast,
        setShowLeaveModal: coinmarketSellActions.setShowLeaveModal,
        saveTrade: coinmarketSpendActions.saveTrade,
        loadInvityData: coinmarketCommonActions.loadInvityData,
    });

    useEffect(() => {
        loadInvityData();
    }, [loadInvityData]);

    const { translationString } = useTranslation();

    const { account, network } = selectedAccount;
    const { souldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const { sellInfo, language, fees } = useSelector(state => ({
        sellInfo: state.wallet.coinmarket.sell.sellInfo,
        language: state.suite.settings.language,
        fees: state.wallet.fees,
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
                        if (response && response.length > 0) {
                            const quote = response[0];
                            if (quote.error === undefined) {
                                setVoucherSiteUrl(quote.siteUrl);
                            } else {
                                setVoucherSiteUrl('error');
                            }
                        } else {
                            setVoucherSiteUrl('error');
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
    const initState = useSpendState(selectedAccount, fees, !!state);
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
            const handleMessage = async (event: Partial<MessageEvent>) => {
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
                                                amount:
                                                    trade.cryptoAmount && souldSendInSats
                                                        ? amountToSatoshi(
                                                              trade.cryptoAmount.toString(),
                                                              network.decimals,
                                                          )
                                                        : trade.cryptoAmount?.toString() || '',
                                            },
                                        ],
                                    },
                                };
                        });
                        composeRequest();
                        setTrade(trade);
                        desktopApi.appFocus();
                    }
                }
            };

            if (isDesktop()) {
                // handle messages from desktop
                desktopApi.on('spend/message', handleMessage);
                return () => {
                    desktopApi.removeAllListeners('spend/message');
                };
            }

            // handle messages from web
            window.addEventListener('message', handleMessage);
            return () => {
                window.removeEventListener('message', handleMessage);
            };
        }
    }, [
        account.symbol,
        isLoading,
        noProviders,
        provider,
        addNotification,
        composeRequest,
        souldSendInSats,
        network.decimals,
    ]);

    const openWindow = async (voucherSiteUrl?: string) => {
        const endpointIframe = await desktopApi.getHttpReceiverAddress('/spend-iframe');
        const handleMessageEndpoint = await desktopApi.getHttpReceiverAddress(
            '/spend-handle-message',
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
