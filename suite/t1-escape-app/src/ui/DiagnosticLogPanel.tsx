import { useState, useSyncExternalStore } from 'react';

import styled from 'styled-components';

import { Button, Card, Column, Paragraph, Row } from '@trezor/components';

import { diagnosticLog, formatDiagnosticEntry } from '../app/diagnosticLog';

const LogText = styled.pre`
    margin: 0;
    max-height: 320px;
    overflow: auto;
    padding: 8px;
    font-size: 11px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-all;
    background: ${({ theme }) => theme.surfaceFillPage};
    border-radius: 8px;
`;

/** Only the newest entries are rendered; the export has all of them. */
const SHOWN_ENTRIES = 300;

const copyLog = () => {
    void navigator.clipboard.writeText(diagnosticLog.toText());
};

const downloadLog = () => {
    const blob = new Blob([diagnosticLog.toText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trezor-one-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    link.click();
    URL.revokeObjectURL(url);
};

/**
 * Lets a tester hand over what the page did without developer tools. The log contains no
 * confidential data, see `diagnosticLog`.
 */
export const DiagnosticLogPanel = () => {
    const entries = useSyncExternalStore(diagnosticLog.subscribe, diagnosticLog.getEntries);
    const [isOpen, setIsOpen] = useState(false);
    const errorCount = entries.filter(({ level }) => level === 'error').length;

    return (
        <Card>
            <Column gap={12} alignItems="flex-start">
                <Paragraph>
                    Diagnostic log: {entries.length} entries
                    {errorCount > 0 ? `, ${errorCount} errors` : ''}. If something does not work,
                    copy it and send it along with your report. It contains no PIN, passphrase,
                    address or amount.
                </Paragraph>
                <Row gap={8}>
                    <Button size="small" priority="secondary" onClick={copyLog}>
                        Copy log
                    </Button>
                    <Button size="small" priority="secondary" onClick={downloadLog}>
                        Download log
                    </Button>
                    <Button size="small" priority="secondary" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? 'Hide' : 'Show'}
                    </Button>
                </Row>
                {isOpen && (
                    <LogText>
                        {entries.slice(-SHOWN_ENTRIES).map(formatDiagnosticEntry).join('\n')}
                    </LogText>
                )}
            </Column>
        </Card>
    );
};
