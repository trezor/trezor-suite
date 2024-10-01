import { useEffect, useState } from 'react';

import { Checkbox } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { BridgeSettings } from '@trezor/suite-desktop-api/src/messages';
import { isDevEnv } from '@suite-common/suite-utils';
import { useSelector } from 'src/hooks/suite';

interface Process {
    service: boolean;
    process: boolean;
}

// note that this variable is duplicated with suite-desktop-core
const NEW_BRIDGE_ROLLOUT_THRESHOLD = 0.01;

export const TransportBackends = () => {
    const allowPrerelease = useSelector(state => state.desktopUpdate.allowPrerelease);
    const transport = useSelector(state => state.suite.transport);
    const [bridgeProcess, setBridgeProcess] = useState<Process>({ service: false, process: false });
    const [bridgeSettings, setBridgeSettings] = useState<BridgeSettings | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        desktopApi.getBridgeStatus().then(result => {
            if (result.success) {
                setBridgeProcess(result.payload);
            }
        });

        desktopApi.on('bridge/status', (status: Process) => {
            setBridgeProcess(status);
        });

        desktopApi.getBridgeSettings().then(result => {
            if (result.success) {
                setBridgeSettings(result.payload);
            } else {
                setError(result.error);
            }
        });

        desktopApi.on('bridge/settings', (settings: BridgeSettings) => {
            setBridgeSettings(settings);
        });

        return () => {
            desktopApi.removeAllListeners('bridge/status');
            desktopApi.removeAllListeners('bridge/settings');
        };
    }, []);

    const changeBridgeSettings = (settings: BridgeSettings) => {
        desktopApi.changeBridgeSettings(settings);
    };

    if (error) return error;

    if (!bridgeSettings) return null;

    return (
        <>
            <SectionItem data-testid="@settings/debug/processes">
                <TextColumn
                    title="Transport backends"
                    description="You may need to restart your application after changes are made."
                />
            </SectionItem>
            <SectionItem data-testid="@settings/debug/processes/Bridge">
                <TextColumn
                    title="Bridge server"
                    description={
                        transport?.version ? `version: ${transport.version}` : 'not running'
                    }
                />
                <ActionColumn>
                    <Checkbox
                        isChecked={bridgeProcess.process}
                        onClick={() => {
                            desktopApi.toggleBridge();
                        }}
                    />
                </ActionColumn>
            </SectionItem>
            <SectionItem data-testid="@settings/debug/processes/bridgeLegacy">
                <TextColumn
                    title="Use legacy Bridge"
                    description="Legacy trezord-go will be spawned as a subprocess"
                />
                <ActionColumn>
                    <Checkbox
                        isChecked={bridgeSettings?.legacy}
                        onClick={() => {
                            changeBridgeSettings({
                                ...bridgeSettings,
                                legacy: !bridgeSettings?.legacy,
                            });
                        }}
                    />
                </ActionColumn>
            </SectionItem>
            <SectionItem data-testid="@settings/debug/processes/runOnStartUp">
                <TextColumn
                    title="Run on startup"
                    description="This is useful for testing of other Transport clients"
                />
                <ActionColumn>
                    <Checkbox
                        isChecked={!bridgeSettings.doNotStartOnStartup}
                        onClick={() => {
                            changeBridgeSettings({
                                ...bridgeSettings,
                                doNotStartOnStartup: !bridgeSettings.doNotStartOnStartup,
                            });
                        }}
                    />
                </ActionColumn>
            </SectionItem>
            {!isDevEnv && (
                <SectionItem data-testid="@settings/debug/processes/newBridgeRollout">
                    <TextColumn
                        title="New bridge rollout"
                        description={
                            allowPrerelease
                                ? 'New bridge is rolled out to all Trezor Suite instances that are in the Early access program and to a few users apart EAP.'
                                : `New bridge is rolled out to ${NEW_BRIDGE_ROLLOUT_THRESHOLD * 100} % of Trezor Suite instances outside of Early access. Your rollout score is ${((bridgeSettings.newBridgeRollout ?? 0) * 100).toFixed()}%`
                        }
                    />
                </SectionItem>
            )}
        </>
    );
};
