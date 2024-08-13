import { calculateRevisionForDevice } from '../calculateRevisionForDevice';

describe(calculateRevisionForDevice.name, () => {
    it('does not shorten hash for `version > 2.4.0`', () => {
        expect(
            calculateRevisionForDevice({
                version: [2, 4, 1],
                commitRevision: 'dd4671a5104952ef505d28d1f9e94d1484b4607a',
            }),
        ).toBe('dd4671a5104952ef505d28d1f9e94d1484b4607a');
    });

    it('shortens the hash for `version > 2.2.0` && `version <= 2.4.0` to 9 characters', () => {
        expect(
            calculateRevisionForDevice({
                version: [2, 4, 0],
                commitRevision: 'dd4671a5104952ef505d28d1f9e94d1484b4607a',
            }),
        ).toBe('dd4671a51');
    });

    it('shortens the hash for `version > 2.0.0 && <=version 2.1.8` to 8 characters', () => {
        expect(
            calculateRevisionForDevice({
                version: [2, 1, 8],
                commitRevision: 'dd4671a5104952ef505d28d1f9e94d1484b4607a',
            }),
        ).toBe('dd4671a5');
    });

    it('does not shorten hash for `version < 2.0.0`', () => {
        expect(
            calculateRevisionForDevice({
                version: [1, 9, 1],
                commitRevision: 'dd4671a5104952ef505d28d1f9e94d1484b4607a',
            }),
        ).toBe('dd4671a5104952ef505d28d1f9e94d1484b4607a');
    });
});
