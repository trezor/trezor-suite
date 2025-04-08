import { useState } from 'react';

import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { UserContextPayload } from '@suite-common/suite-types';
import { networksCollection } from '@suite-common/wallet-config';
import { parseCSV } from '@suite-common/wallet-utils';
import {
    Card,
    CollapsibleBox,
    Column,
    NewModal,
    Paragraph,
    Tabs,
    Textarea,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { DropZone } from 'src/components/suite/DropZone';

import { DelimiterForm } from './DelimiterForm';
import { useExampleCSV } from './useExampleCSV';

type ImportTransactionModalProps = {
    onCancel: () => any;
    decision: Extract<UserContextPayload, { type: 'import-transaction' }>['decision'];
};

export const ImportTransactionModal = ({ onCancel, decision }: ImportTransactionModalProps) => {
    const [mode, setMode] = useState<'upload' | 'manual'>('upload');
    const [delimiter, setDelimiter] = useState<string | undefined>(undefined);
    const [content, setContent] = useState<string>('');
    const exampleCSV = useExampleCSV();

    const onCsvResult = (result: string) => {
        const parsed = parseCSV(result, ['address', 'amount', 'currency', 'label'], delimiter);

        parsed.forEach(item => {
            const network = networksCollection.find(
                network => network.displaySymbol === item.currency,
            );

            if (network) {
                item.currency = network.symbol;
            }
        });

        decision.resolve(parsed);
        onCancel();
    };

    const onCsvSelect = (file: File, setError: (msg: ExtendedMessageDescriptor) => void) => {
        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result !== 'string' || !reader.result.length) {
                setError({ id: 'TR_DROPZONE_ERROR_EMPTY' });
            } else {
                setContent(reader.result);
            }
        };
        reader.onerror = () => {
            setError({ id: 'TR_DROPZONE_ERROR', values: { error: reader.error!.message } });
            reader.abort();
        };
        reader.readAsText(file);
    };

    return (
        <NewModal
            onCancel={onCancel}
            heading={<Translation id="TR_IMPORT_CSV_MODAL_TITLE" />}
            bottomContent={
                <NewModal.Button
                    onClick={() => onCsvResult(content)}
                    isDisabled={!content}
                    data-testid="@import-csv/import-button"
                >
                    <Translation id="IMPORT_CSV" />
                </NewModal.Button>
            }
            size="small"
        >
            <Column gap={spacings.md}>
                <CollapsibleBox
                    heading={<Translation id="TR_IMPORT_CSV_MODAL_SHOW_EXAMPLE" />}
                    hasDivider={false}
                >
                    <Card paddingType="normal">
                        <Paragraph typographyStyle="label" as="pre" isMonospaced>
                            {exampleCSV}
                        </Paragraph>
                    </Card>
                </CollapsibleBox>
                <Card>
                    <Column gap={spacings.lg}>
                        <Tabs activeItemId={mode}>
                            <Tabs.Item id="upload" onClick={() => setMode('upload')}>
                                <Translation id="TR_IMPORT_CSV_FROM_FILE" />
                            </Tabs.Item>
                            <Tabs.Item id="manual" onClick={() => setMode('manual')}>
                                <Translation id="TR_IMPORT_CSV_FROM_TEXT" />
                            </Tabs.Item>
                        </Tabs>
                        {mode === 'upload' ? (
                            <DropZone
                                accept=".csv,.txt,text/csv"
                                iconName="fileCsv"
                                onSelect={onCsvSelect}
                            />
                        ) : (
                            <Textarea
                                rows={5}
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                        )}
                        <DelimiterForm value={delimiter} onChange={setDelimiter} />
                    </Column>
                </Card>
            </Column>
        </NewModal>
    );
};
