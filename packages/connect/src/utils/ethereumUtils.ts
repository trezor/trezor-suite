// origin: https://github.com/trezor/connect/blob/develop/src/js/utils/ethereumUtils.js

export const getNetworkLabel = (
    label: string,
    network?: {
        name: string;
    },
) => {
    if (network) {
        const name = network.name.toLowerCase().indexOf('testnet') >= 0 ? 'Testnet' : network.name;

        return label.replace('#NETWORK', name);
    }

    return label.replace('#NETWORK', '');
};
