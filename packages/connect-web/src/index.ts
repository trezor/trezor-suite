import type { ConnectSettingsPublic, ConnectSettingsWeb } from '@trezor/connect';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import { TrezorConnectDynamic } from '@trezor/connect/src/impl/dynamic';

import { CoreInIframe } from './impl/core-in-iframe';
import { CoreInSuiteDesktop } from './impl/core-in-suite-desktop';
import { CoreInSuiteWeb } from './impl/core-in-suite-web';

type ConnectWebExtraMethods = {
    renderWebUSBButton: (className?: string) => void;
    disableWebUSB: () => void;
    requestWebUSBDevice: () => void;
};

const impl = new TrezorConnectDynamic<
    'iframe' | 'core-in-suite-desktop' | 'core-in-suite-web',
    ConnectSettingsWeb,
    ConnectFactoryDependencies<ConnectSettingsWeb> & ConnectWebExtraMethods
>({
    implementations: [
        {
            type: 'iframe',
            impl: new CoreInIframe(),
        },
        {
            type: 'core-in-suite-desktop',
            impl: new CoreInSuiteDesktop(),
        },
        {
            type: 'core-in-suite-web',
            impl: new CoreInSuiteWeb(),
        },
    ],
    getInitTarget: (settings: Partial<ConnectSettingsPublic & ConnectSettingsWeb>) => {
        if (settings.coreMode === 'iframe') {
            return 'iframe';
        } else if (settings.coreMode === 'suite-desktop') {
            return 'core-in-suite-desktop';
        } else if (settings.coreMode === 'suite-web') {
            return 'core-in-suite-web';
        } else {
            if (settings.coreMode && settings.coreMode !== 'auto') {
                console.warn(`Invalid coreMode: ${settings.coreMode}`);
            }

            return 'core-in-suite-web';
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
        renderWebUSBButton: impl.getTarget().renderWebUSBButton.bind(impl),
        disableWebUSB: impl.getTarget().disableWebUSB.bind(impl),
        requestWebUSBDevice: impl.getTarget().requestWebUSBDevice.bind(impl),
    },
);

export default TrezorConnect;
export * from '@trezor/connect/src/exports';
