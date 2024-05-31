import { useEffect } from 'react';

import styled from 'styled-components';

import { LogMessage } from '@trezor/utils';
import { H2 } from '@trezor/components/src/components/typography/Heading/Heading';

import { Card } from './Card';
import { Translation } from './Translation';
const Log = styled.div`
    font-family: monospace;
    font-size: 12px;
    line-break: anywhere;
`;

const ScrollableLogs = styled.div`
    overflow-y: scroll;
    max-height: 400px;
`;

export interface LogsProps {
    logs: LogMessage[];
}

export const Logs = ({ logs }: LogsProps) => {
    useEffect(() => {
        logs.forEach(log => {
            // eslint-disable-next-line no-console
            console.log(log.message.join(' '));
        });
    }, [logs]);

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
