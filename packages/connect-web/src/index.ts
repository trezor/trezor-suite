import type { ConnectSettingsWeb } from '@trezor/connect';
import { factory } from '@trezor/connect/src/factory';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { TrezorConnectDynamic } from '@trezor/connect-common/src/impl/dynamic';

const impl = new TrezorConnectDynamic<ConnectSettingsWeb>({});

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
