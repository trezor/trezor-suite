import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
    findFirmwareReleaseRegressions,
    requireFirmwareReleaseVersionMonotonicity,
} from '../requireFirmwareReleaseVersionMonotonicity';

type ReleaseFields = {
    readonly version: ReadonlyArray<number>;
    readonly min_firmware_version?: ReadonlyArray<number>;
    readonly min_bootloader_version?: ReadonlyArray<number>;
    readonly bootloader_version?: ReadonlyArray<number>;
};

const createFirmwareDir = (): string => mkdtempSync(join(tmpdir(), 'firmware-releases-'));

const writeRelease = (
    firmwareDir: string,
    channelPath: string,
    release: ReleaseFields,
    fileName = `${release.version.join('-')}.json`,
): void => {
    const channelDir = join(firmwareDir, channelPath);
    mkdirSync(channelDir, { recursive: true });

    writeFileSync(join(channelDir, fileName), JSON.stringify(release));
};

describe(requireFirmwareReleaseVersionMonotonicity.name, () => {
    let firmwareDir: string;

    beforeEach(() => {
        firmwareDir = createFirmwareDir();
    });

    afterEach(() => {
        rmSync(firmwareDir, { recursive: true, force: true });
    });

    it('passes when every monotonic field stays equal or increases', () => {
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 0],
            min_firmware_version: [2, 0, 5],
            min_bootloader_version: [2, 0, 0],
        });
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 6],
            min_firmware_version: [2, 0, 8],
            min_bootloader_version: [2, 0, 0],
        });

        expect(findFirmwareReleaseRegressions(firmwareDir)).toEqual([]);
    });

    it('reports a field that regresses in a higher version', () => {
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 5],
            min_firmware_version: [2, 1, 0],
        });
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 6],
            min_firmware_version: [2, 0, 8],
        });

        const regressions = findFirmwareReleaseRegressions(firmwareDir);

        expect(regressions).toHaveLength(1);
        expect(regressions[0]).toContain('min_firmware_version 2.0.8 is lower than 2.1.0');
        expect(regressions[0]).toContain('preceding version 2.1.5');
        // The reported path is relative to the firmware directory with normalized separators,
        // never the absolute machine/CI path.
        expect(regressions[0]).toMatch(/^tx\/universal\/2-1-6\.json:/);
        expect(regressions[0]).not.toContain(firmwareDir);
    });

    it('compares versions numerically regardless of file order', () => {
        // [2, 1, 10] must sort after [2, 1, 9], not lexicographically before it.
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 10],
            min_firmware_version: [2, 0, 8],
        });
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 9],
            min_firmware_version: [2, 0, 5],
        });

        expect(findFirmwareReleaseRegressions(firmwareDir)).toEqual([]);
    });

    it('orders files sharing a version array deterministically by file name', () => {
        // Two files carry the same version but disagree on the floor; the tie must be broken by
        // file name so the comparison is reproducible regardless of filesystem read order.
        writeRelease(
            firmwareDir,
            'tx/universal',
            { version: [2, 1, 0], min_firmware_version: [2, 0, 8] },
            'b.json',
        );
        writeRelease(
            firmwareDir,
            'tx/universal',
            { version: [2, 1, 0], min_firmware_version: [2, 0, 5] },
            'a.json',
        );

        // a.json (floor 2.0.5) sorts before b.json (floor 2.0.8) -> a rise, not a regression.
        expect(findFirmwareReleaseRegressions(firmwareDir)).toEqual([]);
    });

    it('ignores an optional field that is absent on either side of a pair', () => {
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 0],
            bootloader_version: [2, 0, 3],
        });
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 1],
            min_firmware_version: [2, 0, 5],
        });

        expect(findFirmwareReleaseRegressions(firmwareDir)).toEqual([]);
    });

    it('checks each model and channel independently', () => {
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 0],
            min_firmware_version: [2, 0, 8],
        });
        writeRelease(firmwareDir, 'tx/bitcoinonly', {
            version: [2, 1, 0],
            min_firmware_version: [2, 0, 5],
        });
        // A low value in another channel must not be compared against `tx/universal`.
        writeRelease(firmwareDir, 'ty/universal', {
            version: [2, 1, 0],
            min_firmware_version: [2, 0, 0],
        });

        expect(findFirmwareReleaseRegressions(firmwareDir)).toEqual([]);
    });

    it.each([
        {
            field: 'min_bootloader_version',
            previous: { version: [2, 1, 0], min_bootloader_version: [2, 1, 0] },
            next: { version: [2, 1, 1], min_bootloader_version: [2, 0, 8] },
        },
        {
            field: 'bootloader_version',
            previous: { version: [2, 1, 0], bootloader_version: [2, 1, 0] },
            next: { version: [2, 1, 1], bootloader_version: [2, 0, 8] },
        },
    ] satisfies ReadonlyArray<{ field: string; previous: ReleaseFields; next: ReleaseFields }>)(
        'reports a regression in $field',
        ({ field, previous, next }) => {
            writeRelease(firmwareDir, 'tx/universal', previous);
            writeRelease(firmwareDir, 'tx/universal', next);

            const regressions = findFirmwareReleaseRegressions(firmwareDir);

            expect(regressions).toHaveLength(1);
            expect(regressions[0]).toContain(`${field} 2.0.8 is lower than 2.1.0`);
        },
    );

    it('catches a floor lowered across a version where the field is absent', () => {
        // Present, then omitted, then present again at a lower value: a pairwise check skips both
        // gaps and misses the drop; comparing against the running maximum catches it.
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 0],
            min_firmware_version: [2, 1, 0],
        });
        writeRelease(firmwareDir, 'tx/universal', { version: [2, 1, 1] });
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 2],
            min_firmware_version: [2, 0, 8],
        });

        const regressions = findFirmwareReleaseRegressions(firmwareDir);

        expect(regressions).toHaveLength(1);
        expect(regressions[0]).toContain('min_firmware_version 2.0.8 is lower than 2.1.0');
        expect(regressions[0]).toContain('preceding version 2.1.0');
    });

    it('reports every field that regresses on the same version pair', () => {
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 0],
            min_firmware_version: [2, 1, 0],
            bootloader_version: [2, 1, 0],
        });
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 1],
            min_firmware_version: [2, 0, 8],
            bootloader_version: [2, 0, 8],
        });

        const regressions = findFirmwareReleaseRegressions(firmwareDir);

        expect(regressions).toHaveLength(2);
        expect(regressions.some(error => error.includes('min_firmware_version'))).toBe(true);
        expect(regressions.some(error => error.includes('bootloader_version'))).toBe(true);
    });

    it('reports a regression located in a non-first channel with its channel path', () => {
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 0],
            min_firmware_version: [2, 0, 8],
        });
        writeRelease(firmwareDir, 'tx/universal', {
            version: [2, 1, 1],
            min_firmware_version: [2, 0, 8],
        });
        writeRelease(firmwareDir, 'tx/bitcoinonly', {
            version: [2, 1, 0],
            min_firmware_version: [2, 1, 0],
        });
        writeRelease(firmwareDir, 'tx/bitcoinonly', {
            version: [2, 1, 1],
            min_firmware_version: [2, 0, 8],
        });

        const regressions = findFirmwareReleaseRegressions(firmwareDir);

        expect(regressions).toHaveLength(1);
        expect(regressions[0]).toMatch(/^tx\/bitcoinonly\/2-1-1\.json:/);
    });

    it('has repo scope', () => {
        expect(requireFirmwareReleaseVersionMonotonicity.scope).toBe('repo');
    });
});
