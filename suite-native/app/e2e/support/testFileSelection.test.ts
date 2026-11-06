import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
    ProjectTestFiles,
    canTestSourceMatchGrep,
    getTestFilesMatchingGrep,
    shardProjectTestFiles,
} from './testFileSelection';
import type { ProjectConfig } from '../trezorDetoxRunner/types';

const IOS_NO_DEVICE_GREP = /^(?=.*@noDevice)(?!.*@androidOnly)(?!.*@fixIos)/i;
const ANDROID_NO_DEVICE_GREP = /^(?=.*@noDevice)(?!.*@iosOnly)/i;

const canIOSRunSource = (source: string) =>
    canTestSourceMatchGrep({ source, grepRegex: IOS_NO_DEVICE_GREP });

describe('canTestSourceMatchGrep', () => {
    it('matches the tags of the describe block', () => {
        const source = `
            describe('Account management [@noDevice]', () => {
                it('Import account and rename it', async () => {});
            });
        `;

        expect(canIOSRunSource(source)).toBe(true);
    });

    it('does not match a file whose every test is excluded by the grep', () => {
        const source = `
            describe('Receive [@androidOnly @T3T1 @T3W1]', () => {
                beforeEach(async () => {});
                it('Displays the receive address.', async () => {});
            });
        `;

        expect(canIOSRunSource(source)).toBe(false);
    });

    it('joins the titles of nested describe blocks like Jest', () => {
        const source = `
            describe('Trade Sell [@androidOnly]', () => {
                describe('with portfolio tracker [@noDevice]', () => {
                    it('should display info card', async () => {});
                });
                describe('with device connected [@T3T1]', () => {
                    it('Basic sell USDC for EUR', async () => {});
                });
            });
        `;

        expect(canIOSRunSource(source)).toBe(false);
        expect(canTestSourceMatchGrep({ source, grepRegex: ANDROID_NO_DEVICE_GREP })).toBe(true);
    });

    it('matches a file with one matching describe block among others', () => {
        const source = `
            describe('Send [@androidOnly @T3T1]', () => {
                it('sends', async () => {});
            });
            describe.skip('Settings [@noDevice]', () => {
                test.only(\`changes currency\`, async () => {});
            });
        `;

        expect(canIOSRunSource(source)).toBe(true);
    });

    it('reads tests declared conditionally and tests with metadata', () => {
        const source = `
            describe('Import [@noDevice]', () => {
                if (device.getPlatform() !== 'ios')
                    it('Import BTC Taproot account', { area: 'wallet' }, async () => {});
            });
        `;

        expect(canIOSRunSource(source)).toBe(true);
    });

    it.each([
        [
            'a dynamic test title',
            `describe('Send [@androidOnly]', () => { it(\`sends \${coin}\`, () => {}); });`,
        ],
        [
            'a parametrized test',
            `describe('Send [@androidOnly]', () => { it.each(coins)('sends %s', () => {}); });`,
        ],
        [
            'a tagged template parametrized test',
            "describe('Send [@androidOnly]', () => { it.each`coin\n${\"btc\"}`('sends', () => {}); });",
        ],
        [
            'an aliased test function',
            `const testWithDevice = it; describe('Send [@androidOnly]', () => { testWithDevice('sends', () => {}); });`,
        ],
        [
            'a helper call next to the tests',
            `describe('Send [@androidOnly]', () => { it('sends', () => {}); declareSharedTests(); });`,
        ],
        [
            'a helper call nested in a condition',
            `describe('Send [@androidOnly]', () => { it('sends', () => {}); if (isEnabled) declareSharedTests(); });`,
        ],
        [
            'an awaited helper call',
            `describe('Send [@androidOnly]', async () => { it('sends', () => {}); await declareSharedTests(); });`,
        ],
        [
            'an optional helper call',
            `describe('Send [@androidOnly]', () => { it('sends', () => {}); declareSharedTests?.(); });`,
        ],
        [
            'a helper call as the describe callback body',
            `describe('Send [@androidOnly]', () => { it('sends', () => {}); }); describe('Settings', () => declareSharedTests());`,
        ],
        [
            'a describe callback defined elsewhere',
            `const declareTests = () => { it('changes currency', () => {}); }; describe('Settings [@noDevice]', declareTests);`,
        ],
        [
            'a test declared in a helper function',
            `const declareTest = () => it('changes currency', () => {}); describe('Settings [@noDevice]', () => { const declared = declareTest(); });`,
        ],
        [
            'a module imported for its side effects',
            `import './sharedTests'; describe('Send [@androidOnly]', () => { it('sends', () => {}); });`,
        ],
        ['a top-level helper call', `declareSharedTests('[@noDevice]');`],
        ['no test declared in the file', `const unused = 1;`],
        ['a syntax error', `describe('Send [@androidOnly]', () => {`],
    ])('keeps a file with %s', (_, source) => {
        expect(canIOSRunSource(source)).toBe(true);
    });

    it('ignores test function names used as properties', () => {
        const source = `
            const isMatching = /pattern/.test(name);
            const options = { it: true };
            describe('Send [@androidOnly]', () => {
                beforeAll(() => {
                    jest.setTimeout(1000);
                });
                it('sends', () => {});
            });
        `;

        expect(canIOSRunSource(source)).toBe(false);
    });
});

describe('getTestFilesMatchingGrep', () => {
    let testDir: string;

    beforeAll(() => {
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-file-selection-'));
    });

    afterAll(() => {
        fs.rmSync(testDir, { recursive: true, force: true });
    });

    const writeTestFile = (fileName: string, source: string) => {
        const filePath = path.join(testDir, fileName);
        fs.writeFileSync(filePath, source);

        return filePath;
    };

    it('selects the files with a test matching the grep case-insensitively', () => {
        const noDeviceFile = writeTestFile(
            'noDevice.test.ts',
            `describe('Settings [@NODEVICE]', () => { it('changes currency', () => {}); });`,
        );
        const deviceFile = writeTestFile(
            'device.test.ts',
            `describe('Send [@T3T1]', () => { it('sends', () => {}); });`,
        );

        expect(
            getTestFilesMatchingGrep({
                testFiles: [noDeviceFile, deviceFile],
                grep: '^(?=.*@noDevice)',
            }),
        ).toEqual([noDeviceFile]);
    });

    it('keeps the test path patterns that are not readable files', () => {
        const testPathPatterns = ['send', testDir, path.join(testDir, 'missing.test.ts')];

        expect(
            getTestFilesMatchingGrep({ testFiles: testPathPatterns, grep: '^(?=.*@noDevice)' }),
        ).toEqual(testPathPatterns);
    });

    it('keeps all files when the project has no grep', () => {
        const testFiles = ['first.test.ts', 'second.test.ts'];

        expect(getTestFilesMatchingGrep({ testFiles })).toBe(testFiles);
    });
});

describe('shardProjectTestFiles', () => {
    const mockProject = (projectName: string): ProjectConfig => ({
        projectName,
        target: 'android.emu.release',
    });

    const deviceProject = mockProject('T3T1');
    const noDeviceProject = mockProject('no_device');
    const projectTestFiles: ProjectTestFiles[] = [
        { project: deviceProject, testFiles: ['send.test.ts', 'receive.test.ts', 'pin.test.ts'] },
        { project: mockProject('T1B1'), testFiles: [] },
        { project: noDeviceProject, testFiles: ['settings.test.ts', 'import.test.ts'] },
    ];

    it('spreads the files of all projects evenly and leaves out projects without files', () => {
        expect(shardProjectTestFiles({ projectTestFiles, shard: 0, totalShards: 2 })).toEqual([
            { project: deviceProject, testFiles: ['send.test.ts', 'pin.test.ts'] },
            { project: noDeviceProject, testFiles: ['import.test.ts'] },
        ]);
        expect(shardProjectTestFiles({ projectTestFiles, shard: 1, totalShards: 2 })).toEqual([
            { project: deviceProject, testFiles: ['receive.test.ts'] },
            { project: noDeviceProject, testFiles: ['settings.test.ts'] },
        ]);
    });

    it('returns no projects for a shard without files', () => {
        expect(shardProjectTestFiles({ projectTestFiles, shard: 5, totalShards: 6 })).toEqual([]);
    });
});
