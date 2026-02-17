import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { selectSelectedDevice } from '@suite-common/device';
import {
    cryptoIdToSymbol,
    getUnusedAddressFromAccount,
    parseCryptoId,
    selectTradingAccountKeyByTradeType,
    selectTradingActiveSection,
    selectTradingBuyReceiveAccountKey,
    selectTradingExchangeAccountKey,
} from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import { filterReceiveAccounts } from '@suite-common/wallet-utils';

import { openModal } from 'src/actions/suite/modalActions';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAccountAddressDictionary } from 'src/hooks/wallet/useAccounts';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';
import {
    TradingGetTranslationIdsProps,
    TradingVerifyAccountProps,
    TradingVerifyAccountReturnProps,
    TradingVerifyFormProps,
} from 'src/types/trading/tradingVerify';

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

const useTradingVerifyAccount = ({
    cryptoId,
    nonSuiteAccount,
}: TradingVerifyAccountProps): TradingVerifyAccountReturnProps => {
    const activeSection = useSelector(selectTradingActiveSection);
    const formAccountKey = useSelector(state =>
        selectTradingAccountKeyByTradeType(state, activeSection),
    );
    const selectedAccountKey =
        useSelector(
            activeSection === 'exchange'
                ? selectTradingExchangeAccountKey
                : selectTradingBuyReceiveAccountKey,
        ) || formAccountKey;
    const accounts = useSelector(state => state.wallet.accounts);
    const isDebug = useSelector(selectIsDebugModeActive);
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();
    const [isMenuOpen, setIsMenuOpen] = useState<boolean | undefined>(undefined);

    const { supportedMainnets, supportedTestnets } = useNetworkSupport();

    const methods = useForm<TradingVerifyFormProps>({
        mode: 'onChange',
    });

    const [selectedAccount, setSelectedAccount] = useState<Account | null | undefined>(undefined);
    const [hasSelectionInitialized, setHasSelectionInitialized] = useState(false);

    const networkId = cryptoId && parseCryptoId(cryptoId).networkId;
    const symbol = cryptoId && cryptoIdToSymbol(cryptoId);

    const isSupportedNetwork = [...supportedMainnets, ...supportedTestnets].some(
        network => network.symbol === symbol,
    );

    const suiteReceiveAccounts = useMemo(() => {
        if (!cryptoId) {
            return undefined;
        }

        return filterReceiveAccounts({
            accounts,
            deviceState: device?.state?.staticSessionId,
            symbol,
            isDebug,
        });
    }, [accounts, cryptoId, device?.state?.staticSessionId, isDebug, symbol]);

    const canAddSuiteAccount = !!(device?.connected && isSupportedNetwork);
    const canUseNonSuiteAccount = nonSuiteAccount;

    const preselectedAccount = useMemo(
        () =>
            suiteReceiveAccounts?.find(account => account.key === selectedAccountKey) ??
            suiteReceiveAccounts?.[0],
        [suiteReceiveAccounts, selectedAccountKey],
    );

    const { address } = methods.getValues();
    const addressDictionary = useAccountAddressDictionary(selectedAccount ?? undefined);
    const accountAddress = address ? addressDictionary[address] : undefined;

    const selectSuiteAccount = useCallback(
        (account: Account) => {
            setSelectedAccount(account);
            setHasSelectionInitialized(true);

            const { address: unusedAddress } = getUnusedAddressFromAccount(account);

            methods.setValue('address', unusedAddress, { shouldValidate: true });
        },
        [methods],
    );

    const selectNonSuiteAddress = useCallback(
        (addressValue = '') => {
            setSelectedAccount(null);
            setHasSelectionInitialized(true);
            methods.setValue('address', addressValue, { shouldValidate: false });
        },
        [methods],
    );

    const openAddSuiteAccount = useCallback(() => {
        if (!device || !symbol) {
            return;
        }

        dispatch(
            openModal({
                type: 'add-account',
                device,
                symbol,
                noRedirect: true,
                isCoinjoinDisabled: true,
                isBackClickDisabled: true,
            }),
        );
    }, [device, dispatch, symbol]);

    const onChangeAccount = useCallback(
        (account: Account) => {
            setIsMenuOpen(undefined);
            selectSuiteAccount(account);
        },
        [selectSuiteAccount],
    );

    useEffect(() => {
        setSelectedAccount(undefined);
        setHasSelectionInitialized(false);
    }, [symbol]);

    useEffect(() => {
        if (hasSelectionInitialized) {
            return;
        }

        if (preselectedAccount) {
            selectSuiteAccount(preselectedAccount);

            return;
        }

        if (canUseNonSuiteAccount) {
            selectNonSuiteAddress();

            return;
        }

        methods.setValue('address', '', { shouldValidate: false });
        setSelectedAccount(undefined);
        setHasSelectionInitialized(true);
    }, [
        canUseNonSuiteAccount,
        preselectedAccount,
        selectNonSuiteAddress,
        selectSuiteAccount,
        hasSelectionInitialized,
        methods,
    ]);

    return {
        form: {
            ...methods,
        },
        accountAddress,
        receiveNetwork: networkId,
        suiteReceiveAccounts,
        selectedAccount,
        canAddSuiteAccount,
        canUseNonSuiteAccount,
        isMenuOpen,
        getTranslationIds,
        onChangeAccount,
        selectNonSuiteAddress,
        openAddSuiteAccount,
    };
};

export default useTradingVerifyAccount;
