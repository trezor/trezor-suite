import { isDebugOnlyAccountType, Network, networksCollection } from '@suite-common/wallet-config';
import { selectDevice } from '@suite-common/wallet-core';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { openModal } from 'src/actions/suite/modalActions';
import { Account } from '@suite-common/wallet-types';
import {
    cryptoIdToNetworkSymbol,
    getUnusedAddressFromAccount,
    parseCryptoId,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import {
    CoinmarketAccountType,
    CoinmarketGetSuiteReceiveAccountsProps,
    CoinmarketGetTranslationIdsProps,
    CoinmarketVerifyAccountProps,
    CoinmarketVerifyAccountReturnProps,
    CoinmarketVerifyFormAccountOptionProps,
    CoinmarketVerifyFormProps,
} from 'src/types/coinmarket/coinmarketVerify';
import { useAccountAddressDictionary } from 'src/hooks/wallet/useAccounts';
import { TrezorDevice } from '@suite-common/suite-types';

const getSelectAccountOptions = (
    suiteReceiveAccounts: Account[] | undefined,
    device: TrezorDevice | undefined,
): CoinmarketVerifyFormAccountOptionProps[] => {
    const selectAccountOptions: CoinmarketVerifyFormAccountOptionProps[] = [];

    if (suiteReceiveAccounts) {
        suiteReceiveAccounts.forEach(account => {
            selectAccountOptions.push({ type: 'SUITE', account });
        });

        // have to be signed by private key
        if (device?.connected) {
            selectAccountOptions.push({ type: 'ADD_SUITE' });
        }
    }

    selectAccountOptions.push({ type: 'NON_SUITE' });

    return selectAccountOptions;
};

const getTranslationIds = (
    type: CoinmarketAccountType | undefined,
): CoinmarketGetTranslationIdsProps => {
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

const getSuiteReceiveAccounts = ({
    currency,
    device,
    receiveNetwork,
    isDebug,
    accounts,
}: CoinmarketGetSuiteReceiveAccountsProps): Account[] | undefined => {
    if (currency) {
        const unavailableCapabilities = device?.unavailableCapabilities ?? {};

        // Is the symbol supported by the suite and the device natively?
        const receiveNetworks = networksCollection.filter(
            (n: Network) =>
                n.symbol === receiveNetwork &&
                !unavailableCapabilities[n.symbol] &&
                ((n.isDebugOnlyNetwork && isDebug) || !n.isDebugOnlyNetwork),
        );

        const isSameDevice = (account: Account) => account.deviceState === device?.state;
        const isSameNetwork = (account: Account) => account.symbol === receiveNetwork;
        const isDebugAndIsAccountDebugOnly = (account: Account) =>
            isDebugOnlyAccountType(account.accountType, account.symbol) && isDebug;
        const isNotDebugOnlyAccount = (account: Account) =>
            !isDebugOnlyAccountType(account.accountType, account.symbol);
        // Check if the account is not empty
        const isNotEmptyAccount = (account: Account) => !account.empty;
        // Check if the account is marked as visible
        const isVisibleAccount = (account: Account) => account.visible;
        const isFirstNormalAccount = (account: Account) =>
            account.accountType === 'normal' && account.index === 0;

        if (receiveNetworks.length > 0) {
            // Get accounts of the current symbol belonging to the current device.
            return accounts.filter(
                account =>
                    isSameDevice(account) &&
                    isSameNetwork(account) &&
                    (isDebugAndIsAccountDebugOnly(account) || isNotDebugOnlyAccount(account)) &&
                    (isNotEmptyAccount(account) ||
                        isVisibleAccount(account) ||
                        isFirstNormalAccount(account)),
            );
        }
    }

    return undefined;
};

const useCoinmarketVerifyAccount = ({
    currency,
}: CoinmarketVerifyAccountProps): CoinmarketVerifyAccountReturnProps => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const accounts = useSelector(state => state.wallet.accounts);
    const isDebug = useSelector(selectIsDebugModeActive);
    const device = useSelector(selectDevice);
    const dispatch = useDispatch();
    const [isMenuOpen, setIsMenuOpen] = useState<boolean | undefined>(undefined);

    const methods = useForm<CoinmarketVerifyFormProps>({
        mode: 'onChange',
    });

    const [selectedAccountOption, setSelectedAccountOption] = useState<
        CoinmarketVerifyFormAccountOptionProps | undefined
    >();

    const networkId = currency && parseCryptoId(currency).networkId;
    const receiveNetwork = currency && cryptoIdToNetworkSymbol(currency);
    const suiteReceiveAccounts = useMemo(
        () =>
            getSuiteReceiveAccounts({
                currency,
                device,
                receiveNetwork,
                isDebug,
                accounts,
            }),
        [accounts, currency, device, isDebug, receiveNetwork],
    );
    const selectAccountOptions = useMemo(
        () => getSelectAccountOptions(suiteReceiveAccounts, device),
        [device, suiteReceiveAccounts],
    );
    const preselectedAccount = useMemo(
        () =>
            selectAccountOptions.find(
                accountOption =>
                    accountOption.account?.descriptor === selectedAccount.account?.descriptor,
            ) ?? selectAccountOptions[0],
        [selectAccountOptions, selectedAccount],
    );

    const { address } = methods.getValues();
    const addressDictionary = useAccountAddressDictionary(selectedAccountOption?.account);
    const accountAddress = address ? addressDictionary[address] : undefined;

    const selectAccountOption = (option: CoinmarketVerifyFormAccountOptionProps) => {
        setSelectedAccountOption(option);
        // setReceiveAccount(option.account);
        if (option.account) {
            const { address } = getUnusedAddressFromAccount(option.account);
            methods.setValue('address', address, { shouldValidate: true });
        } else {
            methods.setValue('address', '', { shouldValidate: false });
        }
    };

    const onChangeAccount = (account: CoinmarketVerifyFormAccountOptionProps) => {
        if (account.type === 'ADD_SUITE' && device) {
            setIsMenuOpen(true);
            dispatch(
                openModal({
                    type: 'add-account',
                    device,
                    symbol: receiveNetwork,
                    noRedirect: true,
                }),
            );

            return;
        }

        setIsMenuOpen(undefined);
        selectAccountOption(account);
    };

    // preselect the account
    useEffect(() => {
        if (preselectedAccount && preselectedAccount.type !== 'ADD_SUITE') {
            selectAccountOption(preselectedAccount);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        methods.trigger();
    }, [methods]);

    return {
        form: {
            ...methods,
        },
        accountAddress,
        receiveNetwork: networkId,
        selectAccountOptions,
        selectedAccountOption,
        isMenuOpen,
        getTranslationIds,
        onChangeAccount,
    };
};

export default useCoinmarketVerifyAccount;
