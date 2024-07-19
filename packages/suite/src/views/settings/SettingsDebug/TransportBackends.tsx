import { useEffect, useState } from 'react';

import { Checkbox } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { BridgeSettings } from '@trezor/suite-desktop-api/src/messages';
import { isDevEnv } from '@suite-common/suite-utils';
interface Process {
    service: boolean;
    process: boolean;
}

// note that this variable is duplicated with suite-desktop-core
const NEW_BRIDGE_ROLLOUT_THRESHOLD = 0.2;

export const TransportBackends = () => {
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
            <SectionItem data-test="@settings/debug/processes">
                <TextColumn
                    title="Transport backends"
                    description="You may need to restart your application after changes are made."
                />
            </SectionItem>
            <SectionItem data-test="@settings/debug/processes/Bridge">
                <TextColumn title="Bridge running" />
                <ActionColumn>
                    <Checkbox
                        isChecked={bridgeProcess.process === true}
                        onClick={() => {
                            desktopApi.toggleBridge();
                        }}
                    />
                </ActionColumn>
            </SectionItem>
            <SectionItem data-test="@settings/debug/processes/bridgeLegacy">
                <TextColumn
                    title="Use legacy bridge"
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
            <SectionItem data-test="@settings/debug/processes/runOnStartUp">
                <TextColumn title="Run on startup" />
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
                <SectionItem data-test="@settings/debug/processes/newBridgeRollout">
                    <TextColumn
                        title="New bridge rollout"
                        description={`New bridge is being rolled out to only ${NEW_BRIDGE_ROLLOUT_THRESHOLD * 100}% of Trezor Suite instances that have applied for the Early access program. Your rollout score is ${((bridgeSettings.newBridgeRollout ?? 0) * 100).toFixed()}%`}
                    />
                </SectionItem>
            )}
        </>
    );
};
