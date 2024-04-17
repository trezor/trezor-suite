import React, { useEffect, useState } from 'react';

// todo: direct imports to avoid SyntaxError: Unexpected token '<' from svgs
import { H1 } from '@trezor/components/src/components/typography/Heading/Heading';

import { Logs, LogsProps } from '../components/Logs';
import { Devices, DevicesProps } from '../components/Devices';
import { Card } from '../components/Card';
import { Translation } from '../components/Translation';

export type StatusProps = LogsProps &
    DevicesProps & {
        version: string;
    };

export const Status = () => {
    const [data, setData] = useState<StatusProps | undefined>(undefined);

    useEffect(() => {
        fetch(`${window.origin}/status-data`)
            .then(resp => resp.json())
            .then(fetchedData => {
                setData(fetchedData);
            });
    }, []);

    if (!data) return null;

    const { version, devices, logs } = data;

    return (
        <div>
            <H1>
                <Translation id="heading" />
            </H1>
            <Card>
                <div>
                    <Translation id="version" />: {version}
                </div>
                <Translation id="bridge.description" />
            </Card>

            <Devices devices={devices} />

            <Logs logs={logs} />
        </div>
    );
};
