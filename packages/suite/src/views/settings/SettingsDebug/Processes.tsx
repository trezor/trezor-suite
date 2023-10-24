import { useEffect, useState, useMemo } from 'react';

import { Checkbox } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';

interface Process {
    service: boolean;
    process: boolean;
}

export const Processes = () => {
    const [bridgeProcess, setBridgeProcess] = useState<Process>({ service: false, process: false });

    const items = useMemo(
        () => [
            {
                name: 'Bridge',
                // todo:
                // would be nice to have something like
                // desktopApi.toggleProcess('bridge');
                onToggle: () => desktopApi.toggleBridge(),
                isChecked: bridgeProcess.process === true,
            },
        ],
        [bridgeProcess],
    );

    useEffect(() => {
        // todo:
        // would be nice to have something like
        // desktopApi.getProcessesStatus()...
        desktopApi.getBridgeStatus().then(result => {
            if (result.success) {
                setBridgeProcess(result.payload);
            }
        });

        // todo:
        // would be nice to have something like
        // desktopApi.on('process-status-change, (process) => {
        //   process.name === 'bridge'...
        // })
        desktopApi.on('bridge/status', (status: Process) => {
            setBridgeProcess(status);
        });

        return () => {
            desktopApi.removeAllListeners('bridge/status');
        };
    }, []);

    return (
        <>
            <SectionItem data-test="@settings/debug/processes">
                <TextColumn
                    title="Processes"
                    description="You may control subprocesses launched by Trezor Suite in this panel"
                />
            </SectionItem>
            {items.map(item => (
                <SectionItem data-test={`@settings/debug/processes/${item.name}`} key={item.name}>
                    <TextColumn title={item.name} />
                    <ActionColumn>
                        <Checkbox
                            isChecked={item.isChecked}
                            onClick={() => {
                                item.onToggle();
                            }}
                        />
                    </ActionColumn>
                </SectionItem>
            ))}
        </>
    );
};
