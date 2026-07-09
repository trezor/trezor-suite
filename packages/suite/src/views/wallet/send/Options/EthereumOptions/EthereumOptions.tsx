import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';

import { formInputsMaxLength } from '@suite-common/validators';
import { useEvmNonceInfo } from '@suite-common/wallet-core';
import { type AccountWithNetworkType, type FormOptions } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';

import { useSendFormContext } from 'src/hooks/wallet';

import { EthereumNonce } from './EthereumNonce';
import { TransactionData } from '../shared/TransactionData';

export const EthereumOptions = () => {
    const {
        getDefaultValue,
        toggleOption,
        resetDefaultValue,
        composeTransaction,
        account,
        setValue,
        control,
        watch,
    } = useSendFormContext();

    // Nonce editing is toggled from the send-form header dropdown (EVM-only). useWatch keeps this in
    // sync with that cross-component toggle (getValues would not re-render here when it flips).
    // No defaultValue is passed: it would mask the form's current value until the next change event.
    const enabledOptions = useWatch({ name: 'options', control });
    const isEditingNonce = (enabledOptions ?? []).includes('ethereumNonce');

    // Gated on isEditingNonce (the user deliberately opening the nonce override) so this doesn't
    // fetch on every account update; the authoritative check normally deferred to signing time
    // (signEthereumSendFormTransactionThunk) is worth paying for here too, since a stale display
    // both misleads the user and can suggest a nonce that's already in use. This component only
    // ever renders for ethereum accounts (see Options.tsx), hence the cast.
    const { nonceInfo } = useEvmNonceInfo(account as AccountWithNetworkType<'ethereum'>, {
        enabled: isEditingNonce,
    });
    const displayNonce = nonceInfo?.nextNonce.toString();
    const confirmedNonce = nonceInfo?.confirmedNonce.toString();

    const options = getDefaultValue('options', []);
    const isDataEnabled = options.includes('transactionData');
    const token = watch('outputs.0.token');

    useEffect(() => {
        if (token && isDataEnabled) {
            toggleOption('transactionData');
            resetDefaultValue('transactionData');
        }
    }, [token, isDataEnabled, toggleOption, resetDefaultValue]);

    const toggle = (option: FormOptions) => {
        toggleOption(option);
        composeTransaction();
    };
    const toggleData = () => toggle('transactionData');

    const cancelNonceOverride = () => {
        setValue('ethereumNonce', '');
        toggleOption('ethereumNonce');
        composeTransaction();
    };

    return (
        <Column gap={16}>
            {isDataEnabled && !token && (
                <TransactionData maxBytes={formInputsMaxLength.ethData} close={toggleData} />
            )}

            {isEditingNonce && (
                <EthereumNonce
                    displayNonce={displayNonce}
                    confirmedNonce={confirmedNonce}
                    onCancel={cancelNonceOverride}
                />
            )}
        </Column>
    );
};
