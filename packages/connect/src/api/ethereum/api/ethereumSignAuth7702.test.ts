import EthereumSignAuth7702 from './ethereumSignAuth7702';
import {
    decodeEthereumDefinition,
    ethereumNetworkInfoFromDefinition,
    getEthereumDefinitions,
} from '../ethereumDefinitions';

jest.mock('../ethereumDefinitions', () => ({
    getEthereumDefinitions: jest.fn(),
    decodeEthereumDefinition: jest.fn(),
    ethereumNetworkInfoFromDefinition: jest.fn(),
}));

type Payload = Record<string, unknown>;

const VALID_PAYLOAD: Payload = {
    method: 'ethereumSignAuth7702',
    path: "m/44'/60'/0'/0/0",
    chainId: 1,
    // Lowercase on purpose - firmware displays what we send, so it has to be checksummed first.
    delegate: '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b',
    nonce: 7,
    __experimental: true,
};

const REVOKE_DELEGATE = '0x0000000000000000000000000000000000000000';

const createMethod = (payload: Payload = VALID_PAYLOAD) =>
    new EthereumSignAuth7702({ payload } as any);

describe('ethereumSignAuth7702', () => {
    beforeEach(() => {
        jest.mocked(getEthereumDefinitions).mockResolvedValue({});
        jest.mocked(decodeEthereumDefinition).mockReturnValue({
            network: undefined,
            token: undefined,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('maps params onto the protobuf message and checksums the delegate', () => {
        const { params } = createMethod() as any;

        expect(params.proto).toEqual({
            address_n: [2147483692, 2147483708, 2147483648, 0, 0],
            chain_id: 1,
            delegate: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
            nonce: 7,
        });
    });

    it('accepts the zero delegate used for revocation', () => {
        const method = createMethod({ ...VALID_PAYLOAD, delegate: REVOKE_DELEGATE }) as any;

        expect(method.params.proto.delegate).toBe(REVOKE_DELEGATE);
        expect(method.info).toBe('Revoke Ethereum EIP-7702 delegation');
    });

    it('describes an authorization as signing, not revoking', () => {
        expect((createMethod() as any).info).toBe('Sign Ethereum EIP-7702 authorization');
    });

    it('accepts chainId 0, which makes the authorization valid on every EVM chain', () => {
        const method = createMethod({ ...VALID_PAYLOAD, chainId: 0 }) as any;

        expect(method.params.proto.chain_id).toBe(0);
    });

    it('rejects params without the experimental opt-in', () => {
        const { __experimental, ...payload } = VALID_PAYLOAD;

        expect(() => createMethod(payload)).toThrow();
    });

    it('accepts an already checksummed delegate', () => {
        const delegate = '0x5A7FC11397E9a8AD41BF10bf13F22B0a63f96f6d';
        const method = createMethod({ ...VALID_PAYLOAD, delegate }) as any;

        expect(method.params.proto.delegate).toBe(delegate);
    });

    it.each([
        ['too short', '0x63c0c19a282a1b52b07dd5a65b58948a07dae32'],
        ['not hexadecimal', '0xzzc0c19a282a1b52b07dd5a65b58948a07dae32b'],
        ['missing the 0x prefix', '63c0c19a282a1b52b07dd5a65b58948a07dae32b'],
        // Mixed case that does not match EIP-55 is most likely a mistyped address.
        ['a broken checksum', '0x63c0C19a282a1B52b07dD5a65b58948A07DAE32B'],
        ['empty', ''],
    ])('rejects a delegate address that is %s', (_description, delegate) => {
        expect(() => createMethod({ ...VALID_PAYLOAD, delegate })).toThrow(
            'Parameter "delegate" is not a valid Ethereum address.',
        );
    });

    it.each([
        ['negative', -1],
        ['fractional', 1.5],
        ['above Number.MAX_SAFE_INTEGER', Number.MAX_SAFE_INTEGER + 1],
        // The wire type is uint64, but JavaScript cannot represent its maximum exactly, so it
        // must be refused rather than rounded into a different authorization.
        ['the uint64 maximum', 2 ** 64 - 1],
    ])('rejects a nonce that is %s', (_description, nonce) => {
        expect(() => createMethod({ ...VALID_PAYLOAD, nonce })).toThrow();
    });

    it('attaches network definitions and names the network from them', async () => {
        const definitions = { encoded_network: new ArrayBuffer(4) };
        jest.mocked(getEthereumDefinitions).mockResolvedValue(definitions);
        jest.mocked(decodeEthereumDefinition).mockReturnValue({
            network: { chain_id: 137, name: 'Polygon', slip44: 966, symbol: 'MATIC' },
            token: undefined,
        });
        jest.mocked(ethereumNetworkInfoFromDefinition).mockReturnValue({ name: 'Polygon' } as any);

        const method = createMethod({ ...VALID_PAYLOAD, chainId: 137 }) as any;
        await method.initAsync();

        expect(getEthereumDefinitions).toHaveBeenCalledWith({ chainId: 137 });
        expect(method.params.proto.definitions).toBe(definitions);
        expect(method.info).toBe('Sign Polygon EIP-7702 authorization');
    });

    it('does not download definitions when the authorization is valid on every chain', async () => {
        const method = createMethod({ ...VALID_PAYLOAD, chainId: 0 }) as any;
        await method.initAsync();

        expect(getEthereumDefinitions).not.toHaveBeenCalled();
        expect(method.params.proto.definitions).toBeUndefined();
    });

    it('returns the signature split into yParity, r and s', async () => {
        const method = createMethod() as any;
        const typedCall = jest.fn().mockResolvedValue({
            type: 'EthereumAuth7702Signature',
            message: {
                signature_v: 1,
                signature_r: 'aa'.repeat(32),
                signature_s: 'bb'.repeat(32),
            },
        });
        method.getDevice = () => ({ getCommands: () => ({ typedCall }) });

        await expect(method.run()).resolves.toEqual({
            yParity: 1,
            r: `0x${'aa'.repeat(32)}`,
            s: `0x${'bb'.repeat(32)}`,
        });
        expect(typedCall).toHaveBeenCalledWith(
            'EthereumSignAuth7702',
            'EthereumAuth7702Signature',
            method.params.proto,
        );
    });
});
