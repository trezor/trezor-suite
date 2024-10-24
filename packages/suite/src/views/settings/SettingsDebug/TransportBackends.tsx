import { Checkbox } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { isDevEnv } from '@suite-common/suite-utils';
import { useSelector } from 'src/hooks/suite';
import { useBridgeDesktopApi } from '../../../hooks/suite/useBridgeDesktopApi';

// note that this variable is duplicated with suite-desktop-core
const NEW_BRIDGE_ROLLOUT_THRESHOLD = 0.01;

export const TransportBackends = () => {
    const allowPrerelease = useSelector(state => state.desktopUpdate.allowPrerelease);
    const transport = useSelector(state => state.suite.transport);

    const { bridgeProcess, bridgeSettings, changeBridgeSettings, bridgeDesktopApiError } =
        useBridgeDesktopApi();

    if (bridgeDesktopApiError) return bridgeDesktopApiError;

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
