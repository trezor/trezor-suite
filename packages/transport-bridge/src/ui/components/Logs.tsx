import styled from 'styled-components';

import { LogMessage } from '@trezor/utils';
import { H2 } from '@trezor/components/src/components/typography/Heading/Heading';

import { Card } from './Card';
import { Translation } from './Translation';
const Log = styled.div`
    font-family: monospace;
    font-size: 12px;
`;

const ScrollableLogs = styled.div`
    overflow-y: scroll;
    max-height: 400px;
`;

export interface LogsProps {
    logs: LogMessage[];
}

export const Logs = ({ logs }: LogsProps) => {
    return (
        <>
            <H2>
                <Translation id="logs" />
            </H2>

            <a href="/logs">download</a>

            <Card>
                <ScrollableLogs>
                    {logs.map(log => (
                        <Log key={log.timestamp}>{log.message.join(' ')}</Log>
                    ))}
                </ScrollableLogs>
            </Card>
        </>
    );
};
