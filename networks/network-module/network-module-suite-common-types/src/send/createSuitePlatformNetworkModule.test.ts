import type { NetworkConfiguration } from './NetworkConfiguration';
import type { SendStrategy } from './SendStrategy';
import { createSuitePlatformNetworkModule } from './createSuitePlatformNetworkModule';

type TestComponents = { sendField: string; sendFeeSelector: string };

const strategy: SendStrategy = {
    getFeeLevels: () => [{ id: 'normal', value: '1' }],
};

const configuration = {
    key: 'test',
    supportedNetworks: ['aaa', 'taaa'],
    send: {
        fields: [
            { id: 'memo', kind: 'text', limit: { bytes: 10 } },
            { id: 'tag', kind: 'uint32' },
        ],
        fee: { model: 'per-transaction', unit: 'drops', selectable: true },
    },
} as const satisfies NetworkConfiguration;

describe('createSuitePlatformNetworkModule', () => {
    const networkModule = createSuitePlatformNetworkModule<typeof configuration, TestComponents>(
        configuration,
        {
            send: {
                strategy,
                fields: { memo: 'MemoInput', tag: 'TagInput' },
                feeSelector: 'FeeSelector',
            },
        },
    );

    it('exposes the configured symbols', () => {
        expect(networkModule.getSupportedNetworks()).toEqual(['aaa', 'taaa']);
    });

    it('pairs declared fields with their components in declaration order', () => {
        expect(networkModule.getSend().fields).toEqual([
            { declaration: configuration.send.fields[0], component: 'MemoInput' },
            { declaration: configuration.send.fields[1], component: 'TagInput' },
        ]);
    });

    it('passes the fee model, strategy and fee selector through', () => {
        const send = networkModule.getSend();

        expect(send.fee).toBe(configuration.send.fee);
        expect(send.strategy).toBe(strategy);
        expect(send.feeSelector).toBe('FeeSelector');
    });

    it('leaves the fee selector out for a fixed fee', () => {
        const fixedFee = {
            ...configuration,
            send: { fields: [], fee: { ...configuration.send.fee, selectable: false } },
        } as const satisfies NetworkConfiguration;

        const send = createSuitePlatformNetworkModule<typeof fixedFee, TestComponents>(fixedFee, {
            send: { strategy, fields: {} },
        }).getSend();

        expect(send.fields).toEqual([]);
        expect(send.feeSelector).toBeUndefined();
    });
});
