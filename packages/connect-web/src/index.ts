import TrezorConnectIframe from './impl/core-in-iframe';
import TrezorConnectCoreInPopup from './impl/core-in-popup';
import type {
    ConnectSettings,
    Manifest,
    TrezorConnect as TrezorConnectInterface,
} from '@trezor/connect/src/types';

type TrezorConnectType = 'core-in-popup' | 'iframe';

class TrezorConnectProxyHandler implements ProxyHandler<TrezorConnectInterface> {
    private currentTarget: TrezorConnectType = 'iframe';

    private getTarget(defaultTarget: TrezorConnectInterface) {
        switch (this.currentTarget) {
            case 'core-in-popup':
                return TrezorConnectCoreInPopup;
            case 'iframe':
            default:
                // Use default target
                return defaultTarget;
        }
    }

    get(defaultTarget: TrezorConnectInterface, prop: string, receiver: any) {
        if (prop === 'init') {
            return async (settings: { manifest: Manifest } & Partial<ConnectSettings>) => {
                if (settings?.useCoreInPopup === true) {
                    this.currentTarget = 'core-in-popup';
                } else {
                    this.currentTarget = 'iframe';
                }

                const target = this.getTarget(defaultTarget);

                return await target.init.apply(target, [settings]);
            };
        }

        return Reflect.get(this.getTarget(defaultTarget), prop, receiver);
    }
}

const TrezorConnect = new Proxy<TrezorConnectInterface>(
    TrezorConnectIframe, // default target
    new TrezorConnectProxyHandler(),
);

export default TrezorConnect;
export * from '@trezor/connect/src/exports';
