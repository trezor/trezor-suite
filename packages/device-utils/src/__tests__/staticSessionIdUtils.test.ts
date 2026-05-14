import {
    type StaticSessionId,
    createStaticSessionId,
    isStaticSessionId,
    parseStaticSessionId,
} from '../staticSessionIdUtils';

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
            ['empty firstTestnetAddress', '@c4d10fab:0'],
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
                firstTestnetAddress: 'mzPxTvm6F1n4ZeTBrCQU3iXrPF6yyyc4d10fab',
                deviceId: 'c4d10fab',
                instance: 2,
            });
        });

        it('does not bleed the instance into the deviceId field (regression)', () => {
            const id = 'mzPx@c4d10fab:7' as StaticSessionId;

            expect(parseStaticSessionId(id).deviceId).toBe('c4d10fab');
        });
    });

    describe(createStaticSessionId.name, () => {
        it('joins the three parts', () => {
            expect(
                createStaticSessionId({
                    firstTestnetAddress: 'mzPx',
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
            ['empty firstTestnetAddress', { firstTestnetAddress: '', deviceId: 'd', instance: 0 }],
            ['empty deviceId', { firstTestnetAddress: 'a', deviceId: '', instance: 0 }],
            ['negative instance', { firstTestnetAddress: 'a', deviceId: 'd', instance: -1 }],
            ['NaN instance', { firstTestnetAddress: 'a', deviceId: 'd', instance: NaN }],
            ['Infinity instance', { firstTestnetAddress: 'a', deviceId: 'd', instance: Infinity }],
            ['decimal instance', { firstTestnetAddress: 'a', deviceId: 'd', instance: 1.5 }],
            [
                '@ in firstTestnetAddress',
                { firstTestnetAddress: 'a@b', deviceId: 'd', instance: 0 },
            ],
            ['@ in deviceId', { firstTestnetAddress: 'a', deviceId: 'd@e', instance: 0 }],
            [': in deviceId', { firstTestnetAddress: 'a', deviceId: 'd:e', instance: 0 }],
        ])('throws on invalid parts (%s)', (_label, parts) => {
            expect(() => createStaticSessionId(parts)).toThrow(/Invalid StaticSessionId parts/);
        });
    });
});
