import TrezorConnect from '@trezor/connect';

import { blacklist } from './blacklist';
import { ConnectKey } from './types';

export const cardanoConnectPatch = (getEnabledNetworks: () => string[]) => {
    // Pass additional parameter `useCardanoDerivation` to Trezor Connect methods
    // in order to enable cardano derivation on a device
    // https://github.com/trezor/trezor-firmware/blob/main/core/src/apps/cardano/README.md#seed-derivation-schemes
    Object.keys(TrezorConnect)
        .filter(k => !blacklist.includes(k as ConnectKey))
        .forEach(key => {
            // typescript complains about params and return type, need to be "any"
            const original: any = TrezorConnect[key as ConnectKey];
            if (!original) return;
            (TrezorConnect[key as ConnectKey] as any) = async (params: any) => {
                const enabledNetworks = getEnabledNetworks();
                const isCardanoMethod = key.startsWith('cardano');
                const cardanoEnabled =
                    !!enabledNetworks.find(a => a === 'ada' || a === 'tada') || isCardanoMethod;
                const result = await original({
                    ...params,
                    useCardanoDerivation: cardanoEnabled,
                });

                return result;
            };
        });
};
