import { useState } from 'react';
import styled from 'styled-components';

import { UserContextPayload } from '@suite-common/suite-types';
import { parseCSV } from '@suite-common/wallet-utils';
import { Translation, Modal } from 'src/components/suite';
import type { ExtendedMessageDescriptor } from 'src/types/suite';
import { DropZone } from 'src/components/suite/DropZone';
import { DelimiterForm } from './DelimiterForm';
import { ExampleCSV } from './ExampleCSV';
import { TabSelection, TabId } from './TabSelection';
import { InputCSV } from './InputCSV';

const StyledModal = styled(Modal)`
    width: 600px;
`;

type ImportTransactionModalProps = {
    onCancel: () => any;
    decision: Extract<UserContextPayload, { type: 'import-transaction' }>['decision'];
};

export const ImportTransactionModal = ({ onCancel, decision }: ImportTransactionModalProps) => {
    const [mode, setMode] = useState<TabId>('upload');
    const [delimiter, setDelimiter] = useState<string | undefined>(undefined);

    const onCsvResult = (result: string) => {
        const parsed = parseCSV(result, ['address', 'amount', 'currency', 'label'], delimiter);
        decision.resolve(parsed);
        onCancel();
    };

    const onCsvSelect = (file: File, setError: (msg: ExtendedMessageDescriptor) => void) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                setError({ id: 'TR_DROPZONE_ERROR_EMPTY' });
                return;
            }
            onCsvResult(reader.result);
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
            <TabSelection selectedTab={mode} setSelectedTab={setMode} />
            {mode === 'form' && <InputCSV onSubmit={onCsvResult} />}
            {mode === 'upload' && (
                <DropZone accept=".csv,.txt,text/csv" icon="CSV" onSelect={onCsvSelect} />
            )}
            <DelimiterForm value={delimiter} onChange={setDelimiter} />
        </StyledModal>
    );
};
