import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { CryptoId } from 'invity-api';

import { selectSelectedDevice } from '@suite-common/device';
import { TrezorDevice } from '@suite-common/suite-types';
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
    TradingAccountType,
    TradingGetTranslationIdsProps,
    TradingVerifyFormAccountOptionProps,
    TradingVerifyFormProps,
} from 'src/types/trading/tradingVerify';

import { useAccountAddressDictionary } from '../../useAccounts';

const getSelectAccountOptions = (
    suiteReceiveAccounts: Account[] | undefined,
    device: TrezorDevice | undefined,
    isSupportedNetwork: boolean,
    nonSuiteAccount: boolean,
): TradingVerifyFormAccountOptionProps[] => {
    const selectAccountOptions: TradingVerifyFormAccountOptionProps[] = [];

    suiteReceiveAccounts?.forEach(account => {
        selectAccountOptions.push({ type: 'SUITE', account });
    });

    // have to be signed by private key
    if (device?.connected && isSupportedNetwork) {
        selectAccountOptions.push({ type: 'ADD_SUITE' });
    }

    if (nonSuiteAccount) {
        selectAccountOptions.push({ type: 'NON_SUITE' });
    }

    return selectAccountOptions;
};

const getTranslationIds = (type: TradingAccountType | undefined): TradingGetTranslationIdsProps => {
    if (type === 'NON_SUITE') {
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

    const persistedReceiveDataLoadedRef = useRef(false);

    const symbol = cryptoId && cryptoIdToSymbol(cryptoId);
    const { supportedMainnets, supportedTestnets } = useNetworkSupport();

    const methods = useForm<TradingVerifyFormProps>({
        mode: 'onChange',
    });

    const [selectedAccountOption, setSelectedAccountOption] = useState<
        TradingVerifyFormAccountOptionProps | undefined
    >();
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

    const selectAccountOptions = useMemo(
        () =>
            getSelectAccountOptions(
                suiteReceiveAccounts,
                device,
                isSupportedNetwork,
                nonSuiteAccount,
            ),
        [device, suiteReceiveAccounts, isSupportedNetwork, nonSuiteAccount],
    );

    const selectAccountOption = useCallback(
        (option: TradingVerifyFormAccountOptionProps, receiveAddress?: string) => {
            setSelectedAccountOption(option);

            if (option.account) {
                const { address } = getUnusedAddressFromAccount(option.account);
                methods.setValue('address', address, { shouldValidate: true });
            } else {
                methods.setValue('address', receiveAddress, { shouldValidate: true });
            }
        },
        [methods],
    );

    const onChangeAccount = (
        account: TradingVerifyFormAccountOptionProps,
        receiveAddress?: string,
    ) => {
        if (account.type === 'ADD_SUITE') {
            return;
        }

        setIsMenuOpen(undefined);
        selectAccountOption(account, receiveAddress);
    };

    useEffect(() => {
        if (!symbol) return;

        const suiteOption = selectAccountOptions.find(option => option.type === 'SUITE');
        const nonSuiteOption = selectAccountOptions.find(option => option.type === 'NON_SUITE');

        const option = suiteOption ?? nonSuiteOption;

        if (!option) return;

        selectAccountOption(option);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol]);

    // change receive account on send account change
    useEffect(() => {
        if (!sendAccountKey) return;

        const sendAccount =
            type === 'exchange'
                ? accounts.find(account => account.key === sendAccountKey)
                : undefined;

        if (sendAccount?.symbol !== symbol) return;

        const option = selectAccountOptions.find(
            accountOption =>
                (accountOption?.account?.key === sendAccountKey ||
                    accountOption?.account?.symbol === symbol) &&
                accountOption?.account?.index === sendAccount?.index,
        );

        if (!option) return;

        selectAccountOption(option);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sendAccountKey, symbol]);

    // select initial option
    // if coming from exchange confirm page, load persisted receive account and address
    // if coming from elsewhere, use default value (first account on the list)
    useEffect(() => {
        if (!symbol) return;
        if (persistedReceiveDataLoadedRef.current) return;

        persistedReceiveDataLoadedRef.current = true;

        if (isPreviousRouteFromTradeSection && persistedReceiveAccountKey) {
            const suiteOption = selectAccountOptions.find(
                option => option.account?.key === persistedReceiveAccountKey,
            );
            if (suiteOption) {
                selectAccountOption(suiteOption);

                return;
            }
        }

        if (isPreviousRouteFromTradeSection && persistedReceiveAddress) {
            const nonSuiteOption = selectAccountOptions.find(option => option.type === 'NON_SUITE');
            if (nonSuiteOption) {
                selectAccountOption(nonSuiteOption, persistedReceiveAddress);

                return;
            }
        }

        const sendAccount =
            type === 'exchange'
                ? accounts.find(account => account.key === sendAccountKey)
                : undefined;

        const suiteOption = selectAccountOptions.find(
            option =>
                option.type === 'SUITE' &&
                (sendAccount && sendAccount.symbol === option.account?.symbol
                    ? option.account?.key === sendAccount.key
                    : true),
        );
        const nonSuiteOption = selectAccountOptions.find(option => option.type === 'NON_SUITE');

        const option = suiteOption ?? nonSuiteOption;

        if (!option) return;

        selectAccountOption(option);
    }, [
        type,
        symbol,
        accounts,
        sendAccountKey,
        selectAccountOptions,
        persistedReceiveAccountKey,
        persistedReceiveAddress,
        isPreviousRouteFromTradeSection,
        selectAccountOption,
    ]);

    const receiveAddressValue = methods.watch('address');
    const extraFieldValue = methods.watch('extraField');

    const addressDictionary = useAccountAddressDictionary(selectedAccountOption?.account);
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
        // hotfix so that the receive address does not reset when opening transaction review modal for approve/revoke
        if (pageType === 'retry') return;

        if (type === 'exchange') {
            dispatch(tradingExchangeActions.setReceiveAddress(receiveAddress));
        }

        if (type === 'buy') {
            dispatch(tradingBuyActions.setReceiveAddress(receiveAddress));
        }
    }, [receiveAddress, pageType, type, dispatch]);

    useEffect(() => {
        // hotfix so that the extra field does not reset when opening transaction review modal for approve/revoke
        if (pageType === 'retry') return;

        if (type === 'exchange') {
            dispatch(tradingExchangeActions.setExtraField(extraField));
        }
    }, [extraField, pageType, type, dispatch]);

    useEffect(() => {
        // hotfix so that the receive account key does not reset when opening transaction review modal for approve/revoke
        if (pageType === 'retry') return;

        if (type === 'exchange') {
            dispatch(
                tradingExchangeActions.setReceiveAccountKey(selectedAccountOption?.account?.key),
            );
        }

        if (type === 'buy') {
            dispatch(tradingBuyActions.setTradingAccountKey(selectedAccountOption?.account?.key));
        }
    }, [selectedAccountOption, pageType, type, dispatch]);

    return {
        form: {
            ...methods,
        },
        suiteReceiveAccounts,
        selectedAccountOption,
        selectAccountOptions,
        accountAddress,
        selectAccountOption,
        isMenuOpen,
        onChangeAccount,
        getTranslationIds,
        receiveAddress,
        extraField,
    };
};
