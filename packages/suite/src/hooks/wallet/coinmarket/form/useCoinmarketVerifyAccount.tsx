import { networksCompatibility } from '@suite-common/wallet-config';
import { selectDevice } from '@suite-common/wallet-core';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { cryptoToNetworkSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { openModal } from 'src/actions/suite/modalActions';
import { Account } from '@suite-common/wallet-types';
import { getUnusedAddressFromAccount } from 'src/utils/wallet/coinmarket/coinmarketUtils';
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
    // exchangeStep === 'RECEIVING_ADDRESS'
    if (currency) {
        const unavailableCapabilities = device?.unavailableCapabilities ?? {};
        // is the symbol supported by the suite and the device natively
        const receiveNetworks = networksCompatibility.filter(
            n =>
                n.symbol === receiveNetwork &&
                !unavailableCapabilities[n.symbol] &&
                ((n.isDebugOnly && isDebug) || !n.isDebugOnly),
        );
        if (receiveNetworks.length > 0) {
            // get accounts of the current symbol belonging to the current device
            return accounts.filter(
                a =>
                    a.deviceState === device?.state &&
                    a.symbol === receiveNetwork &&
                    (!a.empty || a.visible || (a.accountType === 'normal' && a.index === 0)),
            );
        }
    }

    return undefined;
};

const useCoinmarketVerifyAccount = ({
    currency,
}: CoinmarketVerifyAccountProps): CoinmarketVerifyAccountReturnProps => {
    const accounts = useSelector(state => state.wallet.accounts);
    const isDebug = useSelector(selectIsDebugModeActive);
    const device = useSelector(selectDevice);
    const dispatch = useDispatch();

    const methods = useForm<CoinmarketVerifyFormProps>({
        mode: 'onChange',
    });

    const [selectedAccountOption, setSelectedAccountOption] =
        useState<CoinmarketVerifyFormAccountOptionProps>();

    const receiveNetwork = currency && cryptoToNetworkSymbol(currency);
    const suiteReceiveAccounts = getSuiteReceiveAccounts({
        currency,
        device,
        receiveNetwork,
        isDebug,
        accounts,
    });
    const selectAccountOptions = getSelectAccountOptions(suiteReceiveAccounts, device);
    const preselectedAccount = selectAccountOptions[0];

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
        receiveNetwork,
        selectAccountOptions,
        selectedAccountOption,
        getTranslationIds,
        onChangeAccount,
    };
};

export default useCoinmarketVerifyAccount;
