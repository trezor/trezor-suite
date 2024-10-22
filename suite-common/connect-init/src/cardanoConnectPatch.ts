import TrezorConnect from '@trezor/connect';

type ConnectKey = keyof typeof TrezorConnect;

// List of methods that doesn't work with additional `useCardanoDerivation` param
// (eg. because they don't accept options object as a param)
// or they don't trigger seed derivation on a device so there is no need to pass it.
const blacklist: ConnectKey[] = [
    'manifest',
    'init',
    'getSettings',
    'on',
    'off',
    'removeAllListeners',
    'uiResponse',
    'blockchainGetAccountBalanceHistory',
    'blockchainGetCurrentFiatRates',
    'blockchainGetFiatRatesForTimestamps',
    'blockchainDisconnect',
    'blockchainEstimateFee',
    'blockchainGetTransactions',
    'blockchainSetCustomBackend',
    'blockchainSubscribe',
    'blockchainSubscribeFiatRates',
    'blockchainUnsubscribe',
    'blockchainUnsubscribeFiatRates',
    'requestLogin',
    'getCoinInfo',
    'dispose',
    'cancel',
    'renderWebUSBButton',
    'disableWebUSB',
];

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
                const cardanoEnabled = !!enabledNetworks.find(a => a === 'ada' || a === 'tada');
                const result = await original({
                    ...params,
                    useCardanoDerivation: cardanoEnabled,
                });

                return result;
            };
        });
};
