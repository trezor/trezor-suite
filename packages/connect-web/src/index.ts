import type { ConnectSettingsPublic, ConnectSettingsWeb } from '@trezor/connect';
import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import { TrezorConnectDynamic } from '@trezor/connect/src/impl/dynamic';

import { CoreInSuiteDesktop } from './impl/core-in-suite-desktop';
import { CoreInSuiteWeb } from './impl/core-in-suite-web';

const impl = new TrezorConnectDynamic<
    'core-in-suite-desktop' | 'core-in-suite-web',
    ConnectSettingsWeb,
    ConnectFactoryDependencies<ConnectSettingsWeb>
>({
    implementations: [
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

const TrezorConnect = factory<ConnectSettingsWeb, {}>(
    {
        eventEmitter: impl.eventEmitter,
        init: impl.init.bind(impl),
        call: impl.call.bind(impl),
        setTransports: impl.setTransports.bind(impl),
        uiResponse: impl.uiResponse.bind(impl),
        cancel: impl.cancel.bind(impl),
        dispose: impl.dispose.bind(impl),
    },
    {},
);

export default TrezorConnect;
export * from '@trezor/connect/src/exports';
