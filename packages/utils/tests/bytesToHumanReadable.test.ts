import { bytesToHumanReadable } from '../src/bytesToHumanReadable';

describe(bytesToHumanReadable.name, () => {
    it('formats sizes using the appropriate unit', () => {
        expect(bytesToHumanReadable(0)).toBe('0.0 B');
        expect(bytesToHumanReadable(512)).toBe('512.0 B');
        expect(bytesToHumanReadable(1024)).toBe('1.0 KB');
        expect(bytesToHumanReadable(1536)).toBe('1.5 KB');
        expect(bytesToHumanReadable(1024 ** 2)).toBe('1.0 MB');
        expect(bytesToHumanReadable(1024 ** 3)).toBe('1.0 GB');
        expect(bytesToHumanReadable(1024 ** 4)).toBe('1.0 TB');
    });

    it('uses the absolute value for negative input', () => {
        expect(bytesToHumanReadable(-2048)).toBe('2.0 KB');
    });

    it('caps at the largest unit instead of looping forever for >= 1 PB', () => {
        // on the previous implementation these inputs caused an infinite loop
        expect(bytesToHumanReadable(1024 ** 5)).toBe('1024.0 TB');
        expect(bytesToHumanReadable(1024 ** 6)).toBe('1048576.0 TB');
    });
});
