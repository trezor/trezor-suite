import { factory } from '@trezor/connect/src/factory';
import { TrezorConnectDynamic } from '@trezor/connect/src/impl/dynamic';
import { CoreInIframe } from '../impl/core-in-iframe';
import { CoreInModule } from '../impl/core-in-module';
import { ConnectSettingsPublic } from '@trezor/connect';

const impl = new TrezorConnectDynamic<'core-in-module' | 'core-in-popup' | 'iframe'>({
    implementations: [
        {
            type: 'core-in-module',
            impl: new CoreInModule(),
        },
        {
            type: 'iframe',
            impl: new CoreInIframe(),
        },
    ],
    getInitTarget: (settings: Partial<ConnectSettingsPublic>) => {
        // TODO: WIP
        console.log('settings in getInitTarget TrezorConnectDynamic for module', settings);
        return 'core-in-module';
    },
    handleErrorFallback: async (errorCode: string) => {
        // TODO: WIP
        console.log('errorCode', errorCode);
        await impl.switchTarget('core-in-module');

        return true;
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
