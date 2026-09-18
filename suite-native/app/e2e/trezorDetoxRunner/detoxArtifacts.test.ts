import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
    findNewDetoxArtifactsRootDir,
    getAttemptArtifacts,
    listDetoxArtifactsRootDirs,
} from './detoxArtifacts';

const DETOX_CONFIGURATION = 'android.emu.release';

const createTempDir = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'detox-artifacts-'));

const createFile = (...segments: string[]): string => {
    const filePath = path.join(...segments);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, '');

    return filePath;
};

describe('findNewDetoxArtifactsRootDir', () => {
    it('returns the newest run directory of the configuration created since the listing', () => {
        const artifactsDir = createTempDir();
        fs.mkdirSync(path.join(artifactsDir, `${DETOX_CONFIGURATION}.2026-09-18 10-00-00Z`));
        fs.mkdirSync(path.join(artifactsDir, 'ios.sim.release.2026-09-18 10-30-00Z'));
        const previousRootDirs = listDetoxArtifactsRootDirs({
            detoxConfiguration: DETOX_CONFIGURATION,
            artifactsDir,
        });
        fs.mkdirSync(path.join(artifactsDir, `${DETOX_CONFIGURATION}.2026-09-18 10-20-00Z`));
        fs.mkdirSync(path.join(artifactsDir, `${DETOX_CONFIGURATION}.2026-09-18 10-10-00Z`));

        expect(
            findNewDetoxArtifactsRootDir({
                detoxConfiguration: DETOX_CONFIGURATION,
                artifactsDir,
                previousRootDirs,
            }),
        ).toBe(path.join(artifactsDir, `${DETOX_CONFIGURATION}.2026-09-18 10-20-00Z`));
    });

    it('returns undefined when Detox created no new run directory', () => {
        const artifactsDir = createTempDir();
        fs.mkdirSync(path.join(artifactsDir, `${DETOX_CONFIGURATION}.2026-09-18 10-00-00Z`));
        const previousRootDirs = listDetoxArtifactsRootDirs({
            detoxConfiguration: DETOX_CONFIGURATION,
            artifactsDir,
        });

        expect(
            findNewDetoxArtifactsRootDir({
                detoxConfiguration: DETOX_CONFIGURATION,
                artifactsDir,
                previousRootDirs,
            }),
        ).toBeUndefined();
    });

    it('returns undefined when the artifacts directory does not exist', () => {
        expect(
            findNewDetoxArtifactsRootDir({
                detoxConfiguration: DETOX_CONFIGURATION,
                artifactsDir: path.join(createTempDir(), 'missing'),
                previousRootDirs: [],
            }),
        ).toBeUndefined();
    });
});

describe('getAttemptArtifacts', () => {
    it('finds the video, screenshots and device log in the directory Detox names after a failed test', () => {
        const rootDir = createTempDir();
        const testDir = path.join(rootDir, '✗ Send flow sends BTC @T3T1');
        createFile(testDir, 'test.mp4');
        createFile(testDir, 'testStart.png');
        createFile(testDir, 'testDone.png');
        createFile(testDir, 'device.log');

        expect(
            getAttemptArtifacts({
                rootDir,
                fullName: 'Send flow sends BTC @T3T1',
                status: 'failed',
                invocation: 1,
            }),
        ).toEqual([
            {
                path: path.join(testDir, 'device.log'),
                type: 'attachment',
                contentType: 'text/plain',
                name: 'attempt 1 device.log',
            },
            {
                path: path.join(testDir, 'test.mp4'),
                type: 'video',
                contentType: 'video/mp4',
                name: 'attempt 1 test.mp4',
            },
            {
                path: path.join(testDir, 'testDone.png'),
                type: 'screenshot',
                contentType: 'image/png',
                name: 'attempt 1 testDone.png',
            },
            {
                path: path.join(testDir, 'testStart.png'),
                type: 'screenshot',
                contentType: 'image/png',
                name: 'attempt 1 testStart.png',
            },
        ]);
    });

    it('applies the passed sign, the retry suffix and the file name sanitization of Detox', () => {
        const rootDir = createTempDir();
        const testDir = path.join(rootDir, "✓ Receive flow shows address m_44'_0'_0' @T3T1 (2)");
        createFile(testDir, 'test.mp4');

        expect(
            getAttemptArtifacts({
                rootDir,
                fullName: "Receive flow shows address m/44'/0'/0' @T3T1",
                status: 'passed',
                invocation: 2,
            }),
        ).toEqual([
            {
                path: path.join(testDir, 'test.mp4'),
                type: 'video',
                contentType: 'video/mp4',
                name: 'attempt 2 test.mp4',
            },
        ]);
    });

    it('returns nothing when the attempt left no artifacts', () => {
        expect(
            getAttemptArtifacts({
                rootDir: createTempDir(),
                fullName: 'Send flow sends BTC @T3T1',
                status: 'passed',
                invocation: 1,
            }),
        ).toEqual([]);
    });
});
