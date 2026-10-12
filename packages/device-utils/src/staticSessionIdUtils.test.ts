import {
    type StaticSessionId,
    createStaticSessionId,
    isSameWallet,
    isStaticSessionId,
    parseStaticSessionId,
} from './staticSessionIdUtils';

describe('staticSessionIdUtils', () => {
    describe(isStaticSessionId.name, () => {
        it.each([
            'mzPxTvm6F1n4ZeTBrCQU3iXrPF6yyyc4d10fab@c4d10fab:0',
            'mzPxTvm6F1n4ZeTBrCQU3iXrPF6yyyc4d10fab@c4d10fab:1',
            'mzPxTvm6F1n4ZeTBrCQU3iXrPF6yyyc4d10fab@c4d10fab:42',
            // single-character segments still satisfy the "non-empty" requirement
            'a@b:0',
        ])('accepts well-formed input %j', input => {
            expect(isStaticSessionId(input)).toBe(true);
        });

        it.each([
            ['non-string', 42],
            ['null', null],
            ['undefined', undefined],
            ['empty string', ''],
            ['no @', 'mzPxc4d10fab:0'],
            ['multiple @', 'a@b@c:0'],
            ['no :', 'mzPx@c4d10fab'],
            ['multiple :', 'mzPx@c4d10fab:0:1'],
            ['empty walletDescriptor', '@c4d10fab:0'],
            ['empty deviceId', 'mzPx@:0'],
            ['negative instance', 'mzPx@c4d10fab:-1'],
            ['non-numeric instance', 'mzPx@c4d10fab:abc'],
            ['empty instance', 'mzPx@c4d10fab:'],
            // Number.parseInt would silently truncate these — be strict.
            ['instance with trailing garbage', 'mzPx@c4d10fab:1abc'],
            ['decimal instance', 'mzPx@c4d10fab:1.2'],
            ['exponent instance', 'mzPx@c4d10fab:1e3'],
            ['leading-zero instance', 'mzPx@c4d10fab:01'],
        ])('rejects %s', (_label, input) => {
            expect(isStaticSessionId(input)).toBe(false);
        });
    });

    describe(parseStaticSessionId.name, () => {
        it('splits the three parts', () => {
            const id = 'mzPxTvm6F1n4ZeTBrCQU3iXrPF6yyyc4d10fab@c4d10fab:2' as StaticSessionId;

            expect(parseStaticSessionId(id)).toEqual({
                walletDescriptor: 'mzPxTvm6F1n4ZeTBrCQU3iXrPF6yyyc4d10fab',
                deviceId: 'c4d10fab',
                instance: 2,
            });
        });

        it('does not bleed the instance into the deviceId field (regression)', () => {
            const id = 'mzPx@c4d10fab:7' as StaticSessionId;

            expect(parseStaticSessionId(id).deviceId).toBe('c4d10fab');
        });
    });

    describe(isSameWallet.name, () => {
        it.each([
            ['identical ids', 'mzPx@c4d10fab:0', 'mzPx@c4d10fab:0'],
            // Wiping and recovering the same seed mints a new hardware device_id.
            ['same wallet, different deviceId', 'mzPx@c4d10fab:0', 'mzPx@6b2e9a71:0'],
            ['same wallet, different instance', 'mzPx@c4d10fab:0', 'mzPx@c4d10fab:3'],
            ['same wallet, different deviceId and instance', 'mzPx@c4d10fab:0', 'mzPx@6b2e9a71:2'],
        ])('%s are the same wallet', (_label, first, second) => {
            expect(isSameWallet(first as StaticSessionId, second as StaticSessionId)).toBe(true);
        });

        it.each([
            ['different walletDescriptor', 'mzPx@c4d10fab:0', 'n2Rs@c4d10fab:0'],
            [
                'different walletDescriptor, same everything else',
                'mzPx@c4d10fab:1',
                'n2Rs@c4d10fab:1',
            ],
        ])('%s are not the same wallet', (_label, first, second) => {
            expect(isSameWallet(first as StaticSessionId, second as StaticSessionId)).toBe(false);
        });
    });

    describe(createStaticSessionId.name, () => {
        it('joins the three parts', () => {
            expect(
                createStaticSessionId({
                    walletDescriptor: 'mzPx',
                    deviceId: 'c4d10fab',
                    instance: 3,
                }),
            ).toBe('mzPx@c4d10fab:3');
        });

        it('round-trips parseStaticSessionId', () => {
            const original = 'mzPxTvm6F1n4ZeTBrCQU3iXrPF6yyyc4d10fab@c4d10fab:5' as StaticSessionId;

            expect(createStaticSessionId(parseStaticSessionId(original))).toBe(original);
        });

        it.each([
            ['empty walletDescriptor', { walletDescriptor: '', deviceId: 'd', instance: 0 }],
            ['empty deviceId', { walletDescriptor: 'a', deviceId: '', instance: 0 }],
            ['negative instance', { walletDescriptor: 'a', deviceId: 'd', instance: -1 }],
            ['NaN instance', { walletDescriptor: 'a', deviceId: 'd', instance: NaN }],
            ['Infinity instance', { walletDescriptor: 'a', deviceId: 'd', instance: Infinity }],
            ['decimal instance', { walletDescriptor: 'a', deviceId: 'd', instance: 1.5 }],
            ['@ in walletDescriptor', { walletDescriptor: 'a@b', deviceId: 'd', instance: 0 }],
            ['@ in deviceId', { walletDescriptor: 'a', deviceId: 'd@e', instance: 0 }],
            [': in deviceId', { walletDescriptor: 'a', deviceId: 'd:e', instance: 0 }],
        ])('throws on invalid parts (%s)', (_label, parts) => {
            expect(() => createStaticSessionId(parts)).toThrow(/Invalid StaticSessionId parts/);
        });
    });
});
