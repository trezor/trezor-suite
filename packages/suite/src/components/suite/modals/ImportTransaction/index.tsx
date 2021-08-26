import React, { useState } from 'react';
import { Translation, Modal } from '@suite-components';
import type { ExtendedMessageDescriptor } from '@suite-types';
import { DropZone } from '@suite-components/DropZone';
import { UserContextPayload } from '@suite-actions/modalActions';
import { DelimiterForm } from './components/DelimiterForm';
import { ExampleCSV } from './components/ExampleCSV';
import { parseCSV } from '@wallet-utils/csvParser';

type Props = {
    onCancel: () => any;
    decision: Extract<UserContextPayload, { type: 'import-transaction' }>['decision'];
};

const ImportTransaction = ({ onCancel, decision }: Props) => {
    // const [mode, setMode] = useState<'upload' | 'form'>('upload'); // TODO: upload or textarea form? (fallback for upload)
    const [delimiter, setDelimiter] = useState<string | undefined>(undefined);

    const onCsvSelect = (file: File, setError: (msg: ExtendedMessageDescriptor) => void) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                setError({ id: 'TR_DROPZONE_ERROR_EMPTY' });
                return;
            }
            const parsed = parseCSV(
                reader.result,
                ['address', 'amount', 'currency', 'label'],
                delimiter,
            );
            decision.resolve(parsed);
            onCancel();
        };
        reader.onerror = () => {
            setError({ id: 'TR_DROPZONE_ERROR', values: { error: reader.error!.message } });
            reader.abort();
        };
        reader.readAsText(file);
    };

    return (
        <Modal
            cancelable
            onCancel={onCancel}
            heading={<Translation id="TR_IMPORT_CSV_MODAL_TITLE" />}
        >
            <ExampleCSV />
            <DropZone accept=".csv,.txt,text/csv" icon="CSV" onSelect={onCsvSelect} />
            <DelimiterForm value={delimiter} onChange={setDelimiter} />
        </Modal>
    );
};

export default ImportTransaction;
