import React, { useState } from 'react';
import styled from 'styled-components';
import { Translation, Modal } from 'src/components/suite';
import type { ExtendedMessageDescriptor } from 'src/types/suite';
import { DropZone } from 'src/components/suite/DropZone';
import { UserContextPayload } from 'src/actions/suite/modalActions';
import { DelimiterForm } from './components/DelimiterForm';
import { ExampleCSV } from './components/ExampleCSV';
import { parseCSV } from '@suite-common/wallet-utils';

const StyledModal = styled(Modal)`
    width: 600px;
`;

type ImportTransactionProps = {
    onCancel: () => any;
    decision: Extract<UserContextPayload, { type: 'import-transaction' }>['decision'];
};

export const ImportTransaction = ({ onCancel, decision }: ImportTransactionProps) => {
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
        <StyledModal
            isCancelable
            onCancel={onCancel}
            heading={<Translation id="TR_IMPORT_CSV_MODAL_TITLE" />}
        >
            <ExampleCSV />
            <DropZone accept=".csv,.txt,text/csv" icon="CSV" onSelect={onCsvSelect} />
            <DelimiterForm value={delimiter} onChange={setDelimiter} />
        </StyledModal>
    );
};
