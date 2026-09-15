import { Checkbox } from '@trezor/components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { desktopApi } from '@trezor/suite-desktop-api';

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
                                doNotStartOnStartup: !bridgeSettings.doNotStartOnStartup,
                            });
                        }}
                    />
                </ActionColumn>
            </SectionItem>
            <SectionItem data-testid="@settings/debug/processes/usbImplementation">
                <TextColumn
                    title="USB implementation (experimental)"
                    description="Switch the bundled bridge between the legacy usb 2.x (default, known-good) and the new nusb (usb 3.x). Applies after an app restart."
                />
                <ActionColumn>
                    <Checkbox
                        isChecked={(bridgeSettings.usbImplementation ?? 'legacy') === 'nusb'}
                        onChange={() => {
                            changeBridgeSettings({
                                usbImplementation:
                                    (bridgeSettings.usbImplementation ?? 'legacy') === 'nusb'
                                        ? 'legacy'
                                        : 'nusb',
                            });
                        }}
                    />
                </ActionColumn>
            </SectionItem>
            <SectionItem data-testid="@settings/debug/processes/usbRestart">
                <TextColumn
                    title="Apply USB implementation change"
                    description="Restarts Trezor Suite so the selected USB implementation takes effect."
                />
                <ActionColumn>
                    <ActionButton intent="brand" onClick={() => desktopApi.appRestart()}>
                        Restart now
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
        </>
    );
};
