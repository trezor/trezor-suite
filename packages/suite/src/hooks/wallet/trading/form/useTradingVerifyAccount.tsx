import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { TrezorDevice } from '@suite-common/suite-types';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { filterReceiveAccounts } from '@suite-common/wallet-utils';

import { openModal } from 'src/actions/suite/modalActions';
import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAccountAddressDictionary } from 'src/hooks/wallet/useAccounts';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import {
    TradingAccountType,
    TradingGetTranslationIdsProps,
    TradingVerifyAccountProps,
    TradingVerifyAccountReturnProps,
    TradingVerifyFormAccountOptionProps,
    TradingVerifyFormProps,
} from 'src/types/trading/tradingVerify';
import {
    cryptoIdToSymbol,
    getUnusedAddressFromAccount,
    parseCryptoId,
} from 'src/utils/wallet/trading/tradingUtils';

const getSelectAccountOptions = (
    suiteReceiveAccounts: Account[] | undefined,
    device: TrezorDevice | undefined,
    isSupportedNetwork: boolean,
): TradingVerifyFormAccountOptionProps[] => {
    const selectAccountOptions: TradingVerifyFormAccountOptionProps[] = [];

    suiteReceiveAccounts?.forEach(account => {
        selectAccountOptions.push({ type: 'SUITE', account });
    });

    // have to be signed by private key
    if (device?.connected && isSupportedNetwork) {
        selectAccountOptions.push({ type: 'ADD_SUITE' });
    }

    selectAccountOptions.push({ type: 'NON_SUITE' });

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

const useTradingVerifyAccount = ({
    cryptoId,
}: TradingVerifyAccountProps): TradingVerifyAccountReturnProps => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const accounts = useSelector(state => state.wallet.accounts);
    const isDebug = useSelector(selectIsDebugModeActive);
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();
    const [isMenuOpen, setIsMenuOpen] = useState<boolean | undefined>(undefined);

    const { supportedMainnets, supportedTestnets } = useNetworkSupport();

    const methods = useForm<TradingVerifyFormProps>({
        mode: 'onChange',
    });

    const [selectedAccountOption, setSelectedAccountOption] = useState<
        TradingVerifyFormAccountOptionProps | undefined
    >();

    const networkId = cryptoId && parseCryptoId(cryptoId).networkId;
    const symbol = cryptoId && cryptoIdToSymbol(cryptoId);

    const isSupportedNetwork = [...supportedMainnets, ...supportedTestnets].some(
        network => network.symbol === symbol,
    );

    const suiteReceiveAccounts = useMemo(() => {
        if (cryptoId) {
            return filterReceiveAccounts({
                accounts,
                deviceState: device?.state?.staticSessionId,
                symbol,
                isDebug,
            });
        }

        return undefined;
    }, [accounts, cryptoId, device, isDebug, symbol]);

    const selectAccountOptions = useMemo(
        () => getSelectAccountOptions(suiteReceiveAccounts, device, isSupportedNetwork),
        [device, suiteReceiveAccounts, isSupportedNetwork],
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

    const selectAccountOption = (option: TradingVerifyFormAccountOptionProps) => {
        setSelectedAccountOption(option);
        // setReceiveAccount(option.account);
        if (option.account) {
            const { address } = getUnusedAddressFromAccount(option.account);
            methods.setValue('address', address, { shouldValidate: true });
        } else {
            methods.setValue('address', '', { shouldValidate: false });
        }
    };

    const onChangeAccount = (account: TradingVerifyFormAccountOptionProps) => {
        if (account.type === 'ADD_SUITE' && device) {
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
    }, [accounts]);

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

export default useTradingVerifyAccount;
