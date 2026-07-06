import { execSync } from 'child_process';
import * as fsSync from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

type IstanbulFileCoverage = {
    s: Record<string, number>;
    [key: string]: unknown;
};

type IstanbulCoverage = Record<string, IstanbulFileCoverage>;

const ANDROID_PKG = 'io.trezor.suite.debug';
const DEVICE_COVERAGE_PATH = `/data/user/0/${ANDROID_PKG}/files/coverage.json`;

const hasCoverage = (fileCoverage: IstanbulFileCoverage) =>
    Object.values(fileCoverage.s).some(count => count > 0);

const findRepoRoot = (startDir: string): string => {
    let dir = startDir;
    while (dir !== path.dirname(dir)) {
        if (fsSync.existsSync(path.join(dir, '.git'))) {
            return dir;
        }
        dir = path.dirname(dir);
    }

    return startDir;
};

const sanitizeForFilename = (name: string) => name.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 100);

const adb = (cmd: string, opts?: { encoding?: BufferEncoding }) =>
    execSync(`adb shell run-as ${ANDROID_PKG} ${cmd}`, {
        encoding: opts?.encoding ?? 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
    });

const pollForCoverageFile = async (): Promise<boolean> => {
    const POLL_INTERVAL_MS = 200;
    const MAX_ATTEMPTS = 15;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        try {
            adb(`test -f ${DEVICE_COVERAGE_PATH}`);

            return true;
        } catch {
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
        }
    }

    return false;
};

export const collectCoverageMap = async (currentTestName: string, testPath: string) => {
    if (!process.env.COLLECT_COVERAGE_MAP) return;

    // Trigger AppState 'background' event in the app, which causes it to write coverage.json
    await device.sendToHome();

    const fileFound = await pollForCoverageFile();
    if (!fileFound) {
        console.warn(`[coverage] Coverage file not found on device after waiting. Skipping.`);

        return;
    }

    let coverageJson: string;
    try {
        coverageJson = adb(`cat ${DEVICE_COVERAGE_PATH}`);
    } catch (err) {
        console.warn(`[coverage] Failed to read coverage file from device: ${err}`);

        return;
    }

    let coverage: IstanbulCoverage;
    try {
        coverage = JSON.parse(coverageJson);
    } catch (err) {
        console.warn(`[coverage] Failed to parse coverage JSON (truncated/empty file?): ${err}`);

        return;
    }
    const repoRoot = findRepoRoot(process.cwd());

    const coveredFiles = Object.entries(coverage)
        .filter(([, fileCoverage]) => hasCoverage(fileCoverage))
        .map(([filePath]) => path.relative(repoRoot, filePath));

    const testId = `${sanitizeForFilename(path.basename(testPath, '.test.ts'))}_${sanitizeForFilename(currentTestName)}`;
    const outputDir = process.env.COVERAGE_MAP_DIR ?? 'coverage-map';
    await fs.mkdir(outputDir, { recursive: true });

    const data = {
        testId,
        title: currentTestName,
        titlePath: currentTestName.split(' > '),
        file: path.relative(repoRoot, testPath),
        status: 'unknown',
        coveredFiles,
    };

    await fs.writeFile(path.join(outputDir, `${testId}.json`), JSON.stringify(data, null, 2));
};
