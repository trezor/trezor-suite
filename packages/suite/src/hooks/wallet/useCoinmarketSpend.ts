import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useInvityAPI } from '@wallet-hooks/useCoinmarket';
import { Props, SpendContextValues } from '@wallet-types/coinmarketSpend';
import invityAPI from '@suite-services/invityAPI';
import { SellVoucherTrade } from 'invity-api';
import { getUnusedAddressFromAccount } from '@suite/utils/wallet/coinmarket/coinmarketUtils';
import { useActions } from '@suite-hooks';
import { useTranslation } from '@suite-hooks/useTranslation';
import * as coinmarketCommonActions from '@wallet-actions/coinmarket/coinmarketCommonActions';
import * as coinmarketSellActions from '@wallet-actions/coinmarketSellActions';
import * as notificationActions from '@suite-actions/notificationActions';
import { PrecomposedLevels } from '@wallet-types/sendForm';
import { getFeeLevels } from '@wallet-utils/sendFormUtils';
import { isDesktop } from '@suite/utils/suite/env';

export const SpendContext = createContext<SpendContextValues | null>(null);
SpendContext.displayName = 'CoinmarketSpendContext';

export const useCoinmarketSpend = (props: Props): SpendContextValues => {
    const { sellInfo } = useInvityAPI();
    const [voucherSiteUrl, setVoucherSiteUrl] = useState<string | undefined>('error');

    const {
        composeTransaction,
        saveComposedTransaction,
        signTransaction,
        addNotification,
        setShowLeaveModal,
    } = useActions({
        composeTransaction: coinmarketCommonActions.composeTransaction,
        saveComposedTransaction: coinmarketCommonActions.saveComposedTransaction,
        signTransaction: coinmarketCommonActions.signTransaction,
        addNotification: notificationActions.addToast,
        setShowLeaveModal: coinmarketSellActions.setShowLeaveModal,
    });
    const { translationString } = useTranslation();

    const { selectedAccount, language, fees } = props;
    const { account, network } = selectedAccount;

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

    const onSendCrypto = useCallback(
        async (trade: SellVoucherTrade) => {
            if (trade.cryptoAmount && trade.destinationAddress && !trade.error) {
                let errorMessage: string | undefined;
                const selectedFee = 'normal';
                const coinFees = fees[account.symbol];
                const levels = getFeeLevels(account.networkType, coinFees);
                const feeInfo = { ...coinFees, levels };
                const selectedFeeLevel = feeInfo.levels.find(level => level.label === selectedFee);
                if (!selectedFeeLevel) return false;
                const result: PrecomposedLevels | undefined = await composeTransaction({
                    account,
                    amount: trade.cryptoAmount.toString(),
                    feeInfo,
                    feePerUnit: selectedFeeLevel.feePerUnit,
                    selectedFee,
                    feeLimit: selectedFeeLevel.feeLimit || '0',
                    network,
                    isMaxActive: false,
                    address: trade.destinationAddress,
                    isInvity: true,
                });

                const transactionInfo = result ? result[selectedFeeLevel.label] : null;
                if (transactionInfo?.type === 'final') {
                    saveComposedTransaction(transactionInfo);
                    const success = await signTransaction({
                        account,
                        address: trade.destinationAddress,
                        destinationTag: undefined,
                        transactionInfo,
                        network,
                        amount: transactionInfo.totalSpent,
                    });
                    if (success) {
                        await invityAPI.confirmVoucherTrade(trade);
                        setShowLeaveModal(false);
                    }
                    return;
                }

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
        },
        [
            account,
            addNotification,
            composeTransaction,
            fees,
            network,
            saveComposedTransaction,
            setShowLeaveModal,
            signTransaction,
            translationString,
        ],
    );

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

                    if (trade.status === 'SEND_CRYPTO' && !trade.error) {
                        onSendCrypto(trade);
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
    }, [account.symbol, isLoading, noProviders, provider, onSendCrypto, addNotification]);

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
        account,
        isLoading,
        noProviders,
        network,
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
