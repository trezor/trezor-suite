import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    selectAccountNetworkSymbol,
    useResolveNamedAddress,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useFormContext, useWatch } from '@suite-native/forms';

import { type SendOutputsFormValues } from '../sendOutputsFormSchema';
import { getOutputFieldName } from '../utils';
import { useReportEnsResolutionToAnalytics } from './useReportEnsResolutionToAnalytics';

type UseResolvedAddressArgs = {
    inputIndex: number;
    accountKey: AccountKey;
};

/**
 * Resolves a named recipient input (e.g. ENS) and keeps the sibling `resolvedAddress` form field in
 * sync with it, so composing, signing and the review screen read the onchain address while the
 * input keeps showing the name the user typed.
 */
export const useResolvedAddress = ({ inputIndex, accountKey }: UseResolvedAddressArgs) => {
    const { control, getValues, setValue, trigger } = useFormContext<SendOutputsFormValues>();
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const addressFieldName = getOutputFieldName(inputIndex, 'address');
    const resolvedAddressFieldName = getOutputFieldName(inputIndex, 'resolvedAddress');
    const addressValue = useWatch({ control, name: addressFieldName }) ?? '';

    const {
        mode,
        isResolving,
        isFetching,
        isSuccess,
        isError,
        data,
        resolvedAddress,
        reverseResolvedName,
    } = useResolveNamedAddress(addressValue, symbol);

    useReportEnsResolutionToAnalytics({ symbol, mode, isFetching, isSuccess, isError });

    useEffect(() => {
        const nextResolvedAddress = (() => {
            // A hex input reverse-resolves to a name, which is informational only. Writing it here
            // would shadow the already-valid address the user typed.
            if (mode !== 'forward' || isFetching) return undefined;
            // A `null` payload is a definitive "no record": the name parses but points nowhere, so
            // it fails the form the same way an erroring backend does. Empty string marks that
            // failure, keeping it apart from the not-settled-yet `undefined`.
            if (isSuccess) return typeof data === 'string' ? data : '';
            if (isError) return '';

            return undefined;
        })();

        if (getValues(resolvedAddressFieldName) === nextResolvedAddress) return;

        setValue(resolvedAddressFieldName, nextResolvedAddress);
        // The address field owns the error, so re-run its tests against the new sibling value.
        trigger(addressFieldName);
    }, [
        mode,
        isFetching,
        isSuccess,
        isError,
        data,
        addressFieldName,
        resolvedAddressFieldName,
        getValues,
        setValue,
        trigger,
    ]);

    return {
        resolvedAddress,
        reverseResolvedName,
        // Reverse lookups run for every hex address typed, so they must stay silent — only a name
        // the user typed is worth announcing as being resolved.
        isResolvingName: mode === 'forward' && isResolving,
    };
};
