import { Page, TestInfo } from '@playwright/test';
import * as fsSync from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

type IstanbulFileCoverage = {
    s: Record<string, number>;
    [key: string]: unknown;
};

type IstanbulCoverage = Record<string, IstanbulFileCoverage>;

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

const toRelative = (absolutePath: string, repoRoot: string) =>
    path.relative(repoRoot, absolutePath);

export const collectCoverageMap = async (page: Page, testInfo: TestInfo) => {
    if (!process.env.COLLECT_COVERAGE_MAP) return;

    const coverage = await page
        .evaluate(() => (window as unknown as { __coverage__: IstanbulCoverage }).__coverage__)
        .catch(() => null);

    if (!coverage) return;

    const repoRoot = findRepoRoot(process.cwd());

    const coveredFiles = Object.entries(coverage)
        .filter(([, fileCoverage]) => hasCoverage(fileCoverage))
        .map(([filePath]) => toRelative(filePath, repoRoot));

    const outputDir = process.env.COVERAGE_MAP_DIR ?? 'coverage-map';
    await fs.mkdir(outputDir, { recursive: true });

    const data = {
        testId: testInfo.testId,
        title: testInfo.title,
        titlePath: testInfo.titlePath,
        file: toRelative(testInfo.file, repoRoot),
        status: testInfo.status,
        coveredFiles,
    };

    await fs.writeFile(
        path.join(outputDir, `${testInfo.testId}.json`),
        JSON.stringify(data, null, 2),
    );
};
