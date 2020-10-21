import React, { useState } from 'react';
import { Modal } from '@trezor/components';
import { Translation } from '@suite-components';
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

    const onUploadSuccess = (data: string) => {
        const parsed = parseCSV(data, ['address', 'amount', 'currency', 'label'], delimiter);
        decision.resolve(parsed);
        onCancel();
    };

    return (
        <Modal
            cancelable
            onCancel={onCancel}
            heading={<Translation id="TR_IMPORT_CSV_MODAL_TITLE" />}
        >
            <ExampleCSV />
            <DropZone accept="text/csv" onSuccess={onUploadSuccess} />
            <DelimiterForm value={delimiter} onChange={setDelimiter} />
        </Modal>
    );
};

export default ImportTransaction;
