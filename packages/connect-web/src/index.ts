import { factory } from '@trezor/connect/src/factory';
import { TrezorConnectDynamic } from '@trezor/connect/src/impl/dynamic';
import { CoreInIframe } from './impl/core-in-iframe';
import { CoreInPopup } from './impl/core-in-popup';
import type { ConnectSettingsPublic } from '@trezor/connect';
import { getEnv } from './connectSettings';

const IFRAME_ERRORS = ['Init_IframeBlocked', 'Init_IframeTimeout', 'Transport_Missing'];

const impl = new TrezorConnectDynamic<'core-in-popup' | 'iframe'>({
    implementations: [
        {
            type: 'iframe',
            impl: new CoreInIframe(),
        },
        {
            type: 'core-in-popup',
            impl: new CoreInPopup(),
        },
    ],
    getInitTarget: (settings: Partial<ConnectSettingsPublic>) => {
        if (settings.coreMode === 'iframe') {
            return 'iframe';
        } else if (settings.coreMode === 'popup') {
            return 'core-in-popup';
        } else {
            if (settings.coreMode && settings.coreMode !== 'auto') {
                console.warn(`Invalid coreMode: ${settings.coreMode}`);
            }

            return 'iframe';
        }
    },
    handleErrorFallback: async (errorCode: string) => {
        const env = getEnv();

        const isCoreModeDisabled = impl.lastSettings?.popup === false || env === 'webextension';
        const isCoreModeAuto =
            impl.lastSettings?.coreMode === 'auto' || impl.lastSettings?.coreMode === undefined;

        // Handle iframe errors by switching to core-in-popup
        if (!isCoreModeDisabled && isCoreModeAuto && IFRAME_ERRORS.includes(errorCode)) {
            // Check if WebUSB is available and enabled
            const webUsbUnavailableInBrowser = !(navigator as any)?.usb;
            const webUsbDisabledInSettings =
                impl.lastSettings?.transports?.includes('WebUsbTransport') === false ||
                impl.lastSettings?.webusb === false;
            if (
                errorCode === 'Transport_Missing' &&
                (webUsbUnavailableInBrowser || webUsbDisabledInSettings)
            ) {
                // WebUSB not available, no benefit in switching to core-in-popup
                return false;
            }

            await impl.switchTarget('core-in-popup');

            return true;
        }

        return false;
    },
});

const TrezorConnect = factory({
    eventEmitter: impl.eventEmitter,
    init: impl.init.bind(impl),
    call: impl.call.bind(impl),
    manifest: impl.manifest.bind(impl),
    requestLogin: impl.requestLogin.bind(impl),
    uiResponse: impl.uiResponse.bind(impl),
    renderWebUSBButton: impl.renderWebUSBButton.bind(impl),
    disableWebUSB: impl.disableWebUSB.bind(impl),
    requestWebUSBDevice: impl.requestWebUSBDevice.bind(impl),
    cancel: impl.cancel.bind(impl),
    dispose: impl.dispose.bind(impl),
});

export default TrezorConnect;
export * from '@trezor/connect/src/exports';
