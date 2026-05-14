import { Translation } from '@suite/intl';
import { type FormOptions } from '@suite-common/wallet-types';
import { Button, Column, Tooltip } from '@trezor/components';

import { useSendFormContext } from 'src/hooks/wallet';

import { TronNote } from './TronNote';

export const TronOptions = () => {
    const { getDefaultValue, toggleOption, composeTransaction } = useSendFormContext();

    const options = getDefaultValue('options', []);
    const isNoteEnabled = options.includes('transactionData');

    const toggle = (option: FormOptions) => {
        toggleOption(option);
        composeTransaction();
    };

    const toggleNote = () => toggle('transactionData');

    return (
        <Column gap={16}>
            {!isNoteEnabled && (
                <Tooltip content={<Translation id="TR_TRON_NOTE_ADD_TOOLTIP" />} cursor="pointer">
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

            {isNoteEnabled && <TronNote close={toggleNote} />}
        </Column>
    );
};
