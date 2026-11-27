import RegisterEvmNetwork from './registerEvmNetwork';
import type { MethodMessage } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';

const validPayload = {
    method: 'registerEvmNetwork' as const,
    symbol: 'evm146',
    name: 'Sonic',
    chainId: 146,
};

const createMethod = (payload: object) =>
    new RegisterEvmNetwork({
        payload: { ...validPayload, ...payload },
    } as MethodMessage<'registerEvmNetwork'>);

describe(RegisterEvmNetwork.name, () => {
    describe('params validation', () => {
        it('accepts a valid payload without a device', () => {
            const method = createMethod({});

            expect(method.useDevice).toBe(false);
            expect(method.requiredPermissions).toEqual([{ permission: 'internal' }]);
        });

        it.each([
            ['an empty symbol', { symbol: '' }],
            ['a non-string symbol', { symbol: 146 }],
            ['an empty name', { name: '' }],
            ['a zero chain id', { chainId: 0 }],
            ['a negative chain id', { chainId: -1 }],
            ['a fractional chain id', { chainId: 1.5 }],
            ['a string chain id', { chainId: '146' }],
        ])('rejects %s', (_, payload) => {
            expect(() => createMethod(payload)).toThrow();
        });

        it('rejects a payload with a missing parameter', () => {
            const { chainId: _chainId, ...payload } = validPayload;

            expect(
                () => new RegisterEvmNetwork({ payload } as MethodMessage<'registerEvmNetwork'>),
            ).toThrow();
        });
    });

    describe('run', () => {
        it('registers the network and returns its symbol', async () => {
            const result = await createMethod({ symbol: 'evm201', chainId: 201 }).run();

            expect(result).toEqual({ symbol: 'evm201' });
            expect(getCoinInfoOrThrow('evm201')).toMatchObject({ chainId: 201, name: 'Sonic' });
        });

        it('updates a network registered before', async () => {
            const payload = { symbol: 'evm202', chainId: 202 };
            await createMethod(payload).run();
            await createMethod({ ...payload, name: 'Renamed' }).run();

            expect(getCoinInfoOrThrow('evm202').name).toBe('Renamed');
        });

        it('rejects a symbol of a predefined network', () => {
            expect(() => createMethod({ symbol: 'eth', chainId: 205 }).run()).toThrow(
                'already used by a predefined network',
            );
        });
    });
});
