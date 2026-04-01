export type PerTestCoverage = {
    testId: string;
    title: string;
    titlePath: string[];
    file: string;
    status: string;
    coveredFiles: string[];
};

export type CoverageIndex = Record<string, string[]>;
