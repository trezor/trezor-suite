import type TrezorConnect from '@trezor/connect';
import type {
    SignVerifyCapability,
    SignVerifyCapabilityHelpers,
} from '@trezor/network-module-suite-types';

type EthereumSignVerifyConnect = Pick<
    typeof TrezorConnect,
    'ethereumGetAddress' | 'ethereumSignMessage' | 'ethereumVerifyMessage'
>;

export const createEthereumSignVerifyCapability = (
    trezorConnect: EthereumSignVerifyConnect,
    { formatSignedMessage }: Pick<SignVerifyCapabilityHelpers, 'formatSignedMessage'>,
): SignVerifyCapability => ({
    getSignAddresses: account => [
        {
            path: account.path,
            address: account.descriptor,
            category: '',
        },
    ],
    getInitialValues: (account, isSignPage) =>
        isSignPage
            ? {
                  path: account.path,
                  address: account.descriptor,
              }
            : undefined,
    isPathDisabled: () => true,
    sign: ({ device, path, coin, message, hex }) => {
        const params = {
            device,
            path,
            coin,
            message,
            hex,
        };

        return trezorConnect.ethereumSignMessage(params);
    },
    verify: ({ device, address, coin, message, signature, hex }) => {
        const params = {
            device,
            address,
            coin,
            message,
            signature,
            hex,
        };

        return trezorConnect.ethereumVerifyMessage(params);
    },
    showAddress: ({ device, address, path, coin, chunkify }) => {
        const params = {
            device,
            address,
            path,
            coin,
            chunkify,
        };

        return trezorConnect.ethereumGetAddress(params);
    },
    formatSignedMessage: (data, network) =>
        formatSignedMessage(data, (network?.name ?? '').split('(')[0]?.toUpperCase() ?? ''),
});
