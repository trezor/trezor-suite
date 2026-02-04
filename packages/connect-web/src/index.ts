import type { ConnectSettingsPublic, ConnectSettingsWeb } from '@trezor/connect';
import { factory } from '@trezor/connect/src/factory';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { TrezorConnectDynamic } from '@trezor/connect-common/src/impl/dynamic';

const impl = new TrezorConnectDynamic<ConnectSettingsWeb>({
    getInitTarget: (settings: Partial<ConnectSettingsPublic & ConnectSettingsWeb>) => {
        if (settings.coreMode === 'suite-desktop') {
            return 'core-in-suite-desktop';
        } else if (settings.coreMode === 'suite-web') {
            return 'core-in-suite-web';
        } else {
            if (settings.coreMode && settings.coreMode !== 'auto') {
                console.warn(`Invalid coreMode: ${settings.coreMode}`);
            }

            return 'core-in-suite-desktop';
        }
    },
    handleBeforeCall: async () => {
        // Always try if desktop is available again
        const isCoreModeDesktop = impl.lastSettings?.coreMode === 'suite-desktop';
        const isCoreModeAuto =
            impl.lastSettings?.coreMode === 'auto' || impl.lastSettings?.coreMode === undefined;
        if (isCoreModeDesktop || isCoreModeAuto) {
            await impl.switchTarget('core-in-suite-desktop');
        }
    },
    handleErrorFallback: async (errorCode: string) => {
        // Handle desktop errors
        if (
            impl.getTargetType() === 'core-in-suite-desktop' &&
            (errorCode === 'Desktop_ConnectionMissing' || errorCode === 'Method_Unsupported')
        ) {
            await impl.switchTarget('core-in-suite-web');

            return true;
        }

        return false;
    },
});

type ConnectWebExtraMethods = {
    renderWebUSBButton: (className?: string) => void;
    disableWebUSB: () => void;
    requestWebUSBDevice: () => void;
};

const TrezorConnect = factory<ConnectSettingsWeb, ConnectWebExtraMethods>(
    {
        eventEmitter: impl.eventEmitter,
        init: impl.init.bind(impl),
        call: impl.call.bind(impl),
        setTransports: impl.setTransports.bind(impl),
        manifest: impl.manifest.bind(impl),
        uiResponse: impl.uiResponse.bind(impl),
        cancel: impl.cancel.bind(impl),
        dispose: impl.dispose.bind(impl),
    },
    {
        // not needed, only because of types
        renderWebUSBButton: () => {
            throw ERRORS.TypedError('Method_InvalidPackage');
        },
        // not needed, only because of types
        disableWebUSB: () => {
            throw ERRORS.TypedError('Method_InvalidPackage');
        },
        // not needed, only because of types
        requestWebUSBDevice: () => {},
    },
);

export default TrezorConnect;
export * from '@trezor/connect/src/exports';
