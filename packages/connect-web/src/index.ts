import { factory } from '@trezor/connect/src/factory';
import { ConnectDynamicSettings, TrezorConnectDynamic } from '@trezor/connect/src/impl/dynamic';

import { CoreInSuiteDesktop } from './impl/core-in-suite-desktop';
import { CoreInSuiteWeb } from './impl/core-in-suite-web';

const impl = new TrezorConnectDynamic<'core-in-suite-desktop' | 'core-in-suite-web'>({
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
    getInitTarget: (coreMode: ConnectDynamicSettings['coreMode']) => {
        if (coreMode === 'suite-desktop') {
            return 'core-in-suite-desktop';
        } else if (coreMode === 'suite-web') {
            return 'core-in-suite-web';
        } else {
            if (coreMode && coreMode !== 'auto') {
                console.warn(`Invalid coreMode: ${coreMode}`);
            }

            return 'core-in-suite-desktop';
        }
    },
    handleBeforeCall: async (coreMode: ConnectDynamicSettings['coreMode']) => {
        // Always try if desktop is available again
        if (coreMode === 'suite-desktop' || coreMode === 'auto' || coreMode === undefined) {
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

const TrezorConnect = factory(
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
