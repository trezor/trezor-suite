import { useEffect } from 'react';

import { Translation } from '@suite/intl';
import { formInputsMaxLength } from '@suite-common/validators';
import { type FormOptions } from '@suite-common/wallet-types';
import { Button, Column, Row, Tooltip } from '@trezor/components';

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
            <Row gap={8}>
                {!isNoteEnabled && (
                    <Tooltip
                        content={<Translation id="TR_TRON_NOTE_ADD_TOOLTIP" />}
                        cursor="pointer"
                    >
                        <Button
                            intent="neutral"
                            priority="secondary"
                            iconLeft="database"
                            data-testid="send/open-tron-note"
                            onClick={toggleNote}
                        >
                            <Translation id="TR_TRON_NOTE_ADD" />
                        </Button>
                    </Tooltip>
                )}

                {!isDataEnabled && !token && (
                    <Tooltip content={<Translation id="DATA_ADD_TOOLTIP" />} cursor="pointer">
                        <Button
                            intent="neutral"
                            priority="secondary"
                            iconLeft="database"
                            data-testid="send/open-tron-data"
                            onClick={toggleData}
                        >
                            <Translation id="DATA_ADD" />
                        </Button>
                    </Tooltip>
                )}
            </Row>

            {isNoteEnabled && <TronNote close={toggleNote} />}

            {isDataEnabled && !token && (
                <TransactionData maxBytes={formInputsMaxLength.ethData} close={toggleData} />
            )}
        </Column>
    );
};
