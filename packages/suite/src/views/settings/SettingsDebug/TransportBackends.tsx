import { injectDesktopApi } from '@suite/desktop-app-api';
import { useServices } from '@suite-common/dependency-injection';
import { Checkbox } from '@trezor/components';
import { SectionItem } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';
import { useBridgeDesktopApi } from 'src/hooks/suite/useBridgeDesktopApi';
import { selectTransportOfType } from 'src/selectors/suite/suiteSelectors';

export const TransportBackends = () => {
    const bridge = useSelector(selectTransportOfType('BridgeTransport'));
    const { desktopApi } = useServices(injectDesktopApi);

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
            <SectionItem
                data-testid="@settings/debug/processes"
                title="Transport backends"
                description="You may need to restart your application after changes are made."
            />

            <SectionItem
                data-testid="@settings/debug/processes/Bridge"
                title="Bridge server"
                description={bridge?.version ? `version: ${bridge.version}` : 'not running'}
                actions={
                    <Checkbox
                        isChecked={bridgeProcess.process}
                        onChange={() => {
                            toggleBridge();
                        }}
                    />
                }
            />

            <SectionItem
                data-testid="@settings/debug/processes/runOnStartUp"
                title="Run on startup"
                description="This is useful for testing of other Transport clients"
                actions={
                    <Checkbox
                        isChecked={!bridgeSettings.doNotStartOnStartup}
                        onChange={() => {
                            changeBridgeSettings({
                                doNotStartOnStartup: !bridgeSettings.doNotStartOnStartup,
                            });
                        }}
                    />
                }
            />

            <SectionItem
                data-testid="@settings/debug/processes/usbImplementation"
                title="USB implementation (experimental)"
                description="Switch the bundled bridge between the legacy usb 2.x (default, known-good) and the new nusb (usb 3.x). Applies after an app restart."
                actions={
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
                }
            />

            <SectionItem
                data-testid="@settings/debug/processes/usbRestart"
                title="Apply USB implementation change"
                description="Restarts Trezor Suite so the selected USB implementation takes effect."
                actions={
                    <SectionItem.Button intent="brand" onClick={() => desktopApi.appRestart()}>
                        Restart now
                    </SectionItem.Button>
                }
            />
        </>
    );
};
