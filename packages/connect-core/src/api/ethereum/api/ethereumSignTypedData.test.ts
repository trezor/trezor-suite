import type {
    EthereumSignTypedDataMessage,
    EthereumSignTypedDataTypes,
    EthereumSignTypedHash,
} from '@trezor/connect-common';
import { DeviceModelInternal } from '@trezor/device-utils';

import EthereumSignTypedData from './ethereumSignTypedData';
import type { Device } from '../../../device/Device';
import { transformTypedData } from '../ethereumSignTypedData';

const data: EthereumSignTypedDataMessage<EthereumSignTypedDataTypes> = {
    types: {
        EIP712Domain: [{ name: 'name', type: 'string' }],
        Message: [{ name: 'contents', type: 'string' }],
    },
    primaryType: 'Message',
    domain: { name: 'example.trezor.io' },
    message: { contents: 'Hello' },
};
const dataHashes = transformTypedData(data, true);
const domainHash = dataHashes.domain_separator_hash;
const messageHash = dataHashes.message_hash ?? '';
const otherHash = '11'.repeat(32);

type Hashes = Omit<EthereumSignTypedHash<EthereumSignTypedDataTypes>, 'path'>;

const signOnT1B1 = (params: Hashes) => {
    const typedCall = jest.fn((..._args: unknown[]) =>
        Promise.resolve({ message: { address: '0x', signature: '00' } }),
    );
    const device = {
        features: { internal_model: DeviceModelInternal.T1B1 },
        getCommands: () => ({ typedCall }),
    } as unknown as Device;
    const method = new EthereumSignTypedData({
        payload: { method: 'ethereumSignTypedData', path: "m/44'/60'/0'/0/0", ...params },
    });
    method.setDevice(device);
    const result = method.run();

    return { result, typedCall };
};

describe('EthereumSignTypedData on T1B1', () => {
    it.each([true, false])(
        'signs caller hashes that match data (metamask_v4_compat: %s)',
        async metamask_v4_compat => {
            const { result, typedCall } = signOnT1B1({
                data,
                metamask_v4_compat,
                domain_separator_hash: `0x${domainHash}`,
                message_hash: `0x${messageHash}`,
            });

            await expect(result).resolves.toMatchObject({ signature: '0x00' });
            expect(typedCall).toHaveBeenCalledWith(
                'EthereumSignTypedHash',
                'EthereumTypedDataSignature',
                expect.objectContaining({
                    domain_separator_hash: domainHash,
                    message_hash: messageHash,
                }),
            );
        },
    );

    it('signs a domain-only hash that matches data', async () => {
        const { result } = signOnT1B1({
            data: {
                types: {
                    EIP712Domain: [
                        { name: 'name', type: 'string' },
                        { name: 'version', type: 'string' },
                        { name: 'chainId', type: 'uint256' },
                        { name: 'verifyingContract', type: 'string' },
                        { name: 'salt', type: 'string' },
                    ],
                },
                primaryType: 'EIP712Domain',
                domain: {
                    name: 'Injective Web3',
                    version: '1.0.0',
                    chainId: 1,
                    verifyingContract: 'cosmos',
                    salt: '1646906878039',
                },
                message: {},
            },
            metamask_v4_compat: true,
            // trezor-common vector `injective_testcase`
            domain_separator_hash:
                '0x8e96520578ec587b6ad9d06fe5fc352b34e98090044921089e1a9cbc1290901c',
        });

        await expect(result).resolves.toMatchObject({ signature: '0x00' });
    });

    it.each<[string, Hashes]>([
        [
            'a domain hash',
            {
                data,
                metamask_v4_compat: true,
                domain_separator_hash: otherHash,
                message_hash: messageHash,
            },
        ],
        [
            'a message hash',
            {
                data,
                metamask_v4_compat: true,
                domain_separator_hash: domainHash,
                message_hash: otherHash,
            },
        ],
        [
            'a message hash without metamask_v4_compat',
            {
                data,
                metamask_v4_compat: false,
                domain_separator_hash: domainHash,
                message_hash: otherHash,
            },
        ],
    ])('rejects %s that does not match data', async (_, params) => {
        const { result, typedCall } = signOnT1B1(params);

        await expect(result).rejects.toMatchObject({ code: 'Method_InvalidParameter' });
        expect(typedCall).not.toHaveBeenCalled();
    });
});
