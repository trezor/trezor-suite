import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { CryptoId } from 'invity-api';

import { selectSelectedDevice } from '@suite-common/device';
import {
    TradingType,
    cryptoIdToSymbol,
    getUnusedAddressFromAccount,
    selectTradingBuyReceiveAccountKey,
    selectTradingBuyReceiveAddress,
    selectTradingExchangeAccountKey,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeReceiveAddress,
    tradingBuyActions,
    tradingExchangeActions,
} from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import { filterReceiveAccounts } from '@suite-common/wallet-utils';

import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';
import { TradingPageType } from 'src/types/trading/trading';
import {
    TradingGetTranslationIdsProps,
    TradingVerifyFormProps,
} from 'src/types/trading/tradingVerify';

import { useAccountAddressDictionary } from '../../useAccounts';

const getTranslationIds = (
    selectedAccount: Account | null | undefined,
): TradingGetTranslationIdsProps => {
    if (selectedAccount === null) {
        return {
            accountTooltipTranslationId: 'TR_EXCHANGE_RECEIVE_NON_SUITE_ACCOUNT_QUESTION_TOOLTIP',
            addressTooltipTranslationId: 'TR_EXCHANGE_RECEIVE_NON_SUITE_ADDRESS_QUESTION_TOOLTIP',
        };
    }

    return {
        accountTooltipTranslationId: 'TR_BUY_RECEIVE_ACCOUNT_QUESTION_TOOLTIP',
        addressTooltipTranslationId: 'TR_BUY_RECEIVE_ADDRESS_QUESTION_TOOLTIP',
    };
};

interface UseTradingReceiveAddressProps {
    cryptoId?: CryptoId;
    nonSuiteAccount: boolean;
    isPreviousRouteFromTradeSection: boolean;
    pageType: TradingPageType;
    type: TradingType;
}

export const useTradingReceiveAddress = ({
    type,
    cryptoId,
    nonSuiteAccount,
    isPreviousRouteFromTradeSection,
    pageType,
}: UseTradingReceiveAddressProps) => {
    const dispatch = useDispatch();
    const accounts = useSelector(state => state.wallet.accounts);
    const walletSelectedAccount = useSelector(state => state.wallet.selectedAccount);
    const device = useSelector(selectSelectedDevice);
    const sendAccountKey = useSelector(selectTradingExchangeAccountKey);

    const persistedExchangeReceiveAccountKey = useSelector(selectTradingExchangeReceiveAccountKey);
    const persistedBuyReceiveAccountKey = useSelector(selectTradingBuyReceiveAccountKey);

    const persistedExchangeReceiveAddress = useSelector(selectTradingExchangeReceiveAddress);
    const persistedBuyReceiveAddress = useSelector(selectTradingBuyReceiveAddress);

    const [persistedReceiveAccountKey, persistedReceiveAddress] =
        type === 'exchange'
            ? [persistedExchangeReceiveAccountKey, persistedExchangeReceiveAddress]
            : [persistedBuyReceiveAccountKey, persistedBuyReceiveAddress];

    const isDebug = useSelector(selectIsDebugModeActive);

    const symbol = cryptoId && cryptoIdToSymbol(cryptoId);
    const { supportedMainnets, supportedTestnets } = useNetworkSupport();

    const methods = useForm<TradingVerifyFormProps>({
        mode: 'onChange',
    });

    const [selectedAccount, setSelectedAccount] = useState<Account | null | undefined>(undefined);
    const [hasSelectionInitialized, setHasSelectionInitialized] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState<boolean | undefined>(undefined);

    const isSupportedNetwork = [...supportedMainnets, ...supportedTestnets].some(
        network => network.symbol === symbol,
    );

    const suiteReceiveAccounts = useMemo(
        () =>
            filterReceiveAccounts({
                accounts,
                deviceState: device?.state?.staticSessionId,
                symbol,
                isDebug,
            }),
        [accounts, symbol, device?.state?.staticSessionId, isDebug],
    );

    const canAddSuiteAccount = !!(device?.connected && isSupportedNetwork);
    const canUseNonSuiteAccount = nonSuiteAccount;

    const selectSuiteAccount = useCallback(
        (account: Account) => {
            setSelectedAccount(account);
            setHasSelectionInitialized(true);
            const { address } = getUnusedAddressFromAccount(account);
            methods.setValue('address', address, { shouldValidate: true });
        },
        [methods],
    );

    const onChangeAccount = (account: Account) => {
        setIsMenuOpen(undefined);
        selectSuiteAccount(account);
    };

    const selectNonSuiteAddress = useCallback(
        (address: string, extraFieldValue?: string) => {
            setSelectedAccount(null);
            setHasSelectionInitialized(true);
            methods.setValue('address', address, { shouldValidate: true });

            if (extraFieldValue !== undefined) {
                methods.setValue('extraField', extraFieldValue, { shouldValidate: true });
            }
        },
        [methods],
    );

    useEffect(() => {
        setSelectedAccount(undefined);
        setHasSelectionInitialized(false);
    }, [symbol]);

    useEffect(() => {
        if (!sendAccountKey) return;

        const sendAccount =
            type === 'exchange'
                ? accounts.find(account => account.key === sendAccountKey)
                : undefined;

        if (sendAccount?.symbol !== symbol) return;

        const matchingAccount = suiteReceiveAccounts?.find(
            account =>
                (account.key === sendAccountKey || account.symbol === symbol) &&
                account.index === sendAccount?.index,
        );

        if (!matchingAccount) return;

        selectSuiteAccount(matchingAccount);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sendAccountKey, symbol]);

    useEffect(() => {
        if (!symbol) return;
        if (hasSelectionInitialized) return;

        if (isPreviousRouteFromTradeSection && persistedReceiveAccountKey) {
            const matchingAccount = suiteReceiveAccounts?.find(
                account => account.key === persistedReceiveAccountKey,
            );

            if (matchingAccount) {
                selectSuiteAccount(matchingAccount);

                return;
            }
        }

        if (isPreviousRouteFromTradeSection && persistedReceiveAddress && canUseNonSuiteAccount) {
            selectNonSuiteAddress(persistedReceiveAddress);

            return;
        }

        const preferredReceiveAccountKey =
            persistedReceiveAccountKey ?? walletSelectedAccount.account?.key;
        if (preferredReceiveAccountKey) {
            const preferredSuiteAccount = suiteReceiveAccounts?.find(
                account => account.key === preferredReceiveAccountKey,
            );

            if (preferredSuiteAccount) {
                selectSuiteAccount(preferredSuiteAccount);

                return;
            }
        }

        const sendAccount =
            type === 'exchange'
                ? accounts.find(account => account.key === sendAccountKey)
                : undefined;

        const matchingAccount = suiteReceiveAccounts?.find(account =>
            sendAccount && sendAccount.symbol === account.symbol
                ? account.key === sendAccount.key
                : true,
        );

        if (matchingAccount) {
            selectSuiteAccount(matchingAccount);

            return;
        }

        if (canUseNonSuiteAccount) {
            selectNonSuiteAddress('');

            return;
        }

        methods.setValue('address', '', { shouldValidate: true });
        methods.setValue('extraField', '', { shouldValidate: true });
        setSelectedAccount(undefined);
        setHasSelectionInitialized(true);
    }, [
        type,
        symbol,
        accounts,
        sendAccountKey,
        suiteReceiveAccounts,
        persistedReceiveAccountKey,
        persistedReceiveAddress,
        isPreviousRouteFromTradeSection,
        walletSelectedAccount.account?.key,
        selectSuiteAccount,
        selectNonSuiteAddress,
        canUseNonSuiteAccount,
        hasSelectionInitialized,
        methods,
    ]);

    const receiveAddressValue = methods.watch('address');
    const extraFieldValue = methods.watch('extraField');

    const addressDictionary = useAccountAddressDictionary(selectedAccount ?? undefined);
    const accountAddress = receiveAddressValue ? addressDictionary[receiveAddressValue] : undefined;

    const receiveAddress = useMemo(() => {
        if (!receiveAddressValue) return undefined;
        if (receiveAddressValue.trim() === '') return undefined;
        if (methods.formState.errors.address) return undefined;

        return receiveAddressValue;
    }, [receiveAddressValue, methods.formState.errors.address]);

    const extraField = useMemo(() => {
        if (!extraFieldValue) return undefined;
        if (extraFieldValue.trim() === '') return undefined;
        if (methods.formState.errors.extraField) return undefined;

        return extraFieldValue;
    }, [extraFieldValue, methods.formState.errors.extraField]);

    useEffect(() => {
        if (pageType === 'retry') return;

        if (type === 'exchange') {
            dispatch(tradingExchangeActions.setReceiveAddress(receiveAddress));
        }

        if (type === 'buy') {
            dispatch(tradingBuyActions.setReceiveAddress(receiveAddress));
        }
    }, [receiveAddress, pageType, type, dispatch]);

    useEffect(() => {
        if (pageType === 'retry') return;

        if (type === 'exchange') {
            dispatch(tradingExchangeActions.setExtraField(extraField));
        }
    }, [extraField, pageType, type, dispatch]);

    useEffect(() => {
        if (pageType === 'retry') return;

        if (type === 'exchange') {
            dispatch(tradingExchangeActions.setReceiveAccountKey(selectedAccount?.key));
        }

        if (type === 'buy') {
            dispatch(tradingBuyActions.setReceiveAccountKey(selectedAccount?.key));
        }
    }, [selectedAccount, pageType, type, dispatch]);

    return {
        form: {
            ...methods,
        },
        suiteReceiveAccounts,
        selectedAccount,
        accountAddress,
        isMenuOpen,
        onChangeAccount,
        getTranslationIds,
        receiveAddress,
        extraField,
        canAddSuiteAccount,
        canUseNonSuiteAccount,
        selectNonSuiteAddress,
    };
};
