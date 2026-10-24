import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { runProjectSafely } from './detox';
import { processJUnitReport } from './junitReport';
import { runAllProjects } from './runner';

jest.mock('./currentsUpload', () => ({ uploadToCurrents: jest.fn() }));
jest.mock('./detox', () => ({ runProjectSafely: jest.fn() }));
jest.mock('./detoxArtifacts', () => ({
    DETOX_ARTIFACTS_DIR: 'artifacts',
    listDetoxArtifactsRootDirs: jest.fn(() => []),
    findNewDetoxArtifactsRootDir: jest.fn(),
}));
jest.mock('./junitReport', () => ({ processJUnitReport: jest.fn() }));
jest.mock('./testAttempts', () => ({ readTestAttempts: jest.fn(() => new Map()) }));
jest.mock('./trezorUserEnvLogs', () => ({ extractTrezorUserEnvLogs: jest.fn(() => []) }));

describe('runAllProjects reuse status', () => {
    let temporaryDirectory: string;

    beforeEach(() => {
        temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-reuse-status-'));
        jest.spyOn(process, 'cwd').mockReturnValue(temporaryDirectory);
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.mocked(runProjectSafely).mockReset().mockResolvedValue(false);
        jest.mocked(processJUnitReport).mockReset().mockResolvedValue(false);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    });

    it.each<[string, boolean[], boolean]>([
        ['a clean run', [false], false],
        ['a quarantined failure', [true], true],
        ['a quarantined failure followed by a passing project', [true, false], true],
    ])('records raw failures for %s', async (_, failures, expectedHasFailures) => {
        failures.forEach(failed => jest.mocked(runProjectSafely).mockResolvedValueOnce(failed));
        const projects = failures.map((_, index) => ({
            projectName: 'project-' + index,
            target: 'android.emu.release',
        }));

        await runAllProjects(projects, true, ['test.ts']);

        const reportPath = path.join(temporaryDirectory, 'reports', 'e2e-reuse-status.json');
        expect(fs.existsSync(reportPath)).toBe(true);
        expect(JSON.parse(fs.readFileSync(reportPath, 'utf8'))).toEqual({
            hasFailures: expectedHasFailures,
        });
    });
});
