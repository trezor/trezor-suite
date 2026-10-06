import { useEffect } from 'react';

import { type FormOptions } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';
import { TRON_DATA_MAX_BYTES } from '@trezor/network-tron/constants';

import { useSendFormContext } from 'src/hooks/wallet';

import { TronNote } from './TronNote';
import { TransactionData } from '../shared/TransactionData';

export const TronOptions = () => {
    const { getDefaultValue, toggleOption, composeTransaction, resetDefaultValue, watch } =
        useSendFormContext();

    const options = getDefaultValue('options', []);
    const isNoteEnabled = options.includes('destinationTag');
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

    const toggleNote = () => toggle('destinationTag');
    const toggleData = () => toggle('transactionData');

    return (
        <Column gap={16}>
            {isNoteEnabled && <TronNote close={toggleNote} />}

            {isDataEnabled && !token && (
                <TransactionData maxBytes={TRON_DATA_MAX_BYTES} close={toggleData} />
            )}
        </Column>
    );
};
