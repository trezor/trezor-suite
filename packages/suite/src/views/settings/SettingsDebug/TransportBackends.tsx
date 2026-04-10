import { Checkbox } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';
import { useBridgeDesktopApi } from 'src/hooks/suite/useBridgeDesktopApi';
import { selectTransportOfType } from 'src/selectors/suite/suiteSelectors';

export const TransportBackends = () => {
    const bridge = useSelector(selectTransportOfType('BridgeTransport'));

    const {
        bridgeProcess,
        bridgeSettings,
        changeBridgeSettings,
        toggleBridge,
        bridgeDesktopApiError,
    } = useBridgeDesktopApi();

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
                    description={bridge?.version ? `version: ${bridge.version}` : 'not running'}
                />
                <ActionColumn>
                    <Checkbox
                        isChecked={bridgeProcess.process}
                        onChange={() => {
                            toggleBridge();
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
                        onChange={() => {
                            changeBridgeSettings({
                                ...bridgeSettings,
                                doNotStartOnStartup: !bridgeSettings.doNotStartOnStartup,
                            });
                        }}
                    />
                </ActionColumn>
            </SectionItem>
        </>
    );
};
