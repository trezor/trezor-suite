import { useState } from 'react';
import { useSelector } from 'react-redux';

import { injectAddressValidator } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectAccounts, useResolveNamedAddress } from '@suite-common/wallet-core';
import { findDeviceAccountByDescriptor } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/connect';
import { useServices } from '@trezor/dependency-injection';

type WatchOnlyAddressInputError =
    'TR_ENS_RESOLVE_FAILED' | 'RECIPIENT_IS_NOT_VALID' | 'TR_WATCH_ONLY_ACCOUNT_ALREADY_ADDED';

export const useWatchOnlyAddressInput = (
    symbol: NetworkSymbol | undefined,
    deviceState: StaticSessionId | undefined,
    initialValue = '',
) => {
    const accounts = useSelector(selectAccounts);
    const { addressValidator } = useServices(injectAddressValidator);
    const [value, setValue] = useState(initialValue);
    // An address typed for one network is not meant for the next one picked.
    const [valueSymbol, setValueSymbol] = useState(symbol);
    if (symbol !== valueSymbol) {
        setValueSymbol(symbol);
        setValue(initialValue);
    }
    const { mode, isResolving, resolvedAddress, isResolveError } = useResolveNamedAddress(
        value,
        symbol,
    );

    const trimmedValue = value.trim();
    const isNameInput = mode === 'forward';
    const typedAddress =
        !isNameInput && symbol && addressValidator.isAddressValid(trimmedValue, symbol)
            ? trimmedValue
            : undefined;
    const candidateAddress = isNameInput ? resolvedAddress : typedAddress;
    const existingAccount =
        candidateAddress && symbol && deviceState
            ? findDeviceAccountByDescriptor(accounts, {
                  symbol,
                  deviceState,
                  descriptor: candidateAddress,
              })
            : undefined;

    const getError = (): WatchOnlyAddressInputError | undefined => {
        if (!trimmedValue || isResolving) return undefined;
        if (isNameInput && isResolveError) return 'TR_ENS_RESOLVE_FAILED';
        if (!isNameInput && !typedAddress) return 'RECIPIENT_IS_NOT_VALID';
        if (existingAccount) return 'TR_WATCH_ONLY_ACCOUNT_ALREADY_ADDED';

        return undefined;
    };
    const error = getError();

    return {
        value,
        setValue,
        resolvedAddress: isNameInput ? resolvedAddress : undefined,
        existingAccount,
        address: error ? undefined : candidateAddress,
        error,
        isResolving,
        reset: () => setValue(''),
    };
};

export type WatchOnlyAddressInputState = ReturnType<typeof useWatchOnlyAddressInput>;
