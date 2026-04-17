import { factory } from '@trezor/connect-common/src/factory';
import { CoreInSuiteDesktop } from '@trezor/connect-common/src/impl/core-in-suite-desktop';
import { CoreInSuiteWeb } from '@trezor/connect-common/src/impl/core-in-suite-web';
import { TrezorConnectDynamic } from '@trezor/connect-common/src/impl/dynamic';

const impl = new TrezorConnectDynamic({
    implementations: {
        'core-in-suite-desktop': new CoreInSuiteDesktop(),
        'core-in-suite-web': new CoreInSuiteWeb(),
    },
});

const TrezorConnect = factory({
    eventEmitter: impl.eventEmitter,
    init: impl.init.bind(impl),
    call: impl.call.bind(impl),
    uiResponse: impl.uiResponse.bind(impl),
    updateConnectSettings: impl.updateConnectSettings.bind(impl),
    cancel: impl.cancel.bind(impl),
    dispose: impl.dispose.bind(impl),
});

export default TrezorConnect;
export * from '@trezor/connect-common/src/constants';
export * from '@trezor/connect-common/src/events';
export * from '@trezor/connect-common/src/types';
