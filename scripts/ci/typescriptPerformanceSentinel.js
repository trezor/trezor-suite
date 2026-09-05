import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const SCHEMA_VERSION = 1;
const MAX_LOG_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_PROJECT_ROWS = 30;
const COMMENT_MARKER = '<!-- typescript-performance-sentinel:v1 -->';

const metrics = [
    { key: 'types', label: 'Types' },
    { key: 'instantiations', label: 'Instantiations' },
    { key: 'assignabilityCacheSize', label: 'Assignability cache' },
    { key: 'identityCacheSize', label: 'Identity cache' },
    { key: 'subtypeCacheSize', label: 'Subtype cache' },
    { key: 'strictSubtypeCacheSize', label: 'Strict subtype cache' },
];

const metricKeyByDiagnosticLabel = new Map([
    ['Types', 'types'],
    ['Instantiations', 'instantiations'],
    ['Assignability cache size', 'assignabilityCacheSize'],
    ['Identity cache size', 'identityCacheSize'],
    ['Subtype cache size', 'subtypeCacheSize'],
    ['Strict subtype cache size', 'strictSubtypeCacheSize'],
]);

const ansiEscapePattern = new RegExp(
    `${String.fromCodePoint(27)}(?:[@-Z\\\\-_]|\\[[0-?]*[ -/]*[@-~])`,
    'g',
);
const diagnosticPattern =
    /^([@A-Za-z0-9][@A-Za-z0-9._/-]{0,127}):\s+(Types|Instantiations|Assignability cache size|Identity cache size|Subtype cache size|Strict subtype cache size):\s+([\d,]+)\s*$/;
const shaPattern = /^[a-f0-9]{7,40}$/;
const workflowRunUrlPattern = /^https:\/\/github\.com\/trezor\/trezor-suite\/actions\/runs\/\d+$/;

const createEmptyMetrics = () => ({
    types: 0,
    instantiations: 0,
    assignabilityCacheSize: 0,
    identityCacheSize: 0,
    subtypeCacheSize: 0,
    strictSubtypeCacheSize: 0,
});

export const parseTypeScriptExtendedDiagnostics = diagnosticLog => {
    const projects = {};

    for (const rawLine of diagnosticLog.split(/\r?\n/)) {
        const line = rawLine.replace(ansiEscapePattern, '');
        const match = line.match(diagnosticPattern);

        if (match === null) {
            continue;
        }

        const [, projectName, diagnosticLabel, rawValue] = match;
        const metricKey = metricKeyByDiagnosticLabel.get(diagnosticLabel);

        if (metricKey === undefined) {
            continue;
        }

        const value = Number(rawValue.replaceAll(',', ''));

        if (!Number.isSafeInteger(value) || value < 0) {
            continue;
        }

        const projectMetrics = projects[projectName] ?? createEmptyMetrics();
        projectMetrics[metricKey] += value;
        projects[projectName] = projectMetrics;
    }

    return projects;
};

const isRecord = value => typeof value === 'object' && value !== null && !Array.isArray(value);

const isMetrics = value =>
    isRecord(value) &&
    metrics.every(({ key }) => Number.isSafeInteger(value[key]) && value[key] >= 0);

const validateSnapshot = snapshot => {
    if (
        !isRecord(snapshot) ||
        snapshot.schemaVersion !== SCHEMA_VERSION ||
        typeof snapshot.sourceSha !== 'string' ||
        !shaPattern.test(snapshot.sourceSha) ||
        typeof snapshot.generatedAt !== 'string' ||
        !isRecord(snapshot.projects)
    ) {
        throw new Error('Invalid TypeScript performance snapshot.');
    }

    for (const [projectName, projectMetrics] of Object.entries(snapshot.projects)) {
        if (!diagnosticPattern.test(`${projectName}: Types: 0`) || !isMetrics(projectMetrics)) {
            throw new Error(`Invalid TypeScript performance data for project "${projectName}".`);
        }
    }

    return snapshot;
};

const sumProjectMetrics = ({ projectNames, projects }) => {
    const total = createEmptyMetrics();

    for (const projectName of projectNames) {
        const projectMetrics = projects[projectName];

        for (const { key } of metrics) {
            total[key] += projectMetrics[key];
        }
    }

    return total;
};

const integerFormatter = new Intl.NumberFormat('en-US');
const formatInteger = value => integerFormatter.format(value);

const formatChange = ({ baselineValue, currentValue }) => {
    const difference = currentValue - baselineValue;

    if (difference === 0) {
        return '0 (0.0%)';
    }

    const sign = difference > 0 ? '+' : '−';
    const absoluteDifference = Math.abs(difference);

    if (baselineValue === 0) {
        return `${sign}${formatInteger(absoluteDifference)} (new)`;
    }

    const percentage = (absoluteDifference / baselineValue) * 100;

    return `${sign}${formatInteger(absoluteDifference)} (${sign}${percentage.toFixed(1)}%)`;
};

const createMetricComparisonTable = ({ baselineMetrics, currentMetrics }) => [
    '| Metric | develop | PR | Change |',
    '| --- | ---: | ---: | ---: |',
    ...metrics.map(
        ({ key, label }) =>
            `| ${label} | ${formatInteger(baselineMetrics[key])} | ${formatInteger(currentMetrics[key])} | ${formatChange(
                {
                    baselineValue: baselineMetrics[key],
                    currentValue: currentMetrics[key],
                },
            )} |`,
    ),
];

const createCurrentMetricsTable = currentMetrics => [
    '| Metric | PR |',
    '| --- | ---: |',
    ...metrics.map(({ key, label }) => `| ${label} | ${formatInteger(currentMetrics[key])} |`),
];

const getProjectDifferenceWeight = ({ baselineMetrics, currentMetrics }) =>
    Math.abs(currentMetrics.instantiations - baselineMetrics.instantiations) +
    Math.abs(currentMetrics.types - baselineMetrics.types);

const createProjectComparison = ({ baseline, current }) => {
    const currentProjectNames = Object.keys(current.projects).sort();
    const comparableProjectNames = currentProjectNames.filter(
        projectName => baseline.projects[projectName] !== undefined,
    );
    const newProjectNames = currentProjectNames.filter(
        projectName => baseline.projects[projectName] === undefined,
    );
    const baselineTotal = sumProjectMetrics({
        projectNames: comparableProjectNames,
        projects: baseline.projects,
    });
    const currentTotal = sumProjectMetrics({
        projectNames: comparableProjectNames,
        projects: current.projects,
    });
    const sortedComparableProjects = comparableProjectNames.sort(
        (firstProjectName, secondProjectName) =>
            getProjectDifferenceWeight({
                baselineMetrics: baseline.projects[secondProjectName],
                currentMetrics: current.projects[secondProjectName],
            }) -
            getProjectDifferenceWeight({
                baselineMetrics: baseline.projects[firstProjectName],
                currentMetrics: current.projects[firstProjectName],
            }),
    );
    const displayedProjectNames = [...sortedComparableProjects, ...newProjectNames].slice(
        0,
        MAX_PROJECT_ROWS,
    );
    const projectRows = displayedProjectNames.map(projectName => {
        const baselineMetrics = baseline.projects[projectName];
        const currentMetrics = current.projects[projectName];

        if (baselineMetrics === undefined) {
            return `| ${projectName} | ${formatInteger(currentMetrics.types)} | ${formatInteger(
                currentMetrics.instantiations,
            )} | No baseline |`;
        }

        return `| ${projectName} | ${formatChange({
            baselineValue: baselineMetrics.types,
            currentValue: currentMetrics.types,
        })} | ${formatChange({
            baselineValue: baselineMetrics.instantiations,
            currentValue: currentMetrics.instantiations,
        })} | Compared |`;
    });
    const hiddenProjectCount = currentProjectNames.length - displayedProjectNames.length;

    return {
        baselineTotal,
        comparableProjectNames,
        currentTotal,
        hiddenProjectCount,
        projectRows,
    };
};

export const createTypeScriptPerformanceReport = ({
    baseline,
    current,
    typeCheckOutcome,
    workflowRunUrl,
}) => {
    validateSnapshot(current);

    if (baseline !== undefined) {
        validateSnapshot(baseline);
    }

    const runLink = workflowRunUrlPattern.test(workflowRunUrl)
        ? `[workflow run](${workflowRunUrl})`
        : 'workflow run unavailable';
    const lines = [
        COMMENT_MARKER,
        '## TypeScript complexity',
        '',
        '> Report-only. Deterministic compiler counters are collected from the existing affected-project type-check; check time and memory are intentionally omitted.',
        '',
    ];

    if (typeCheckOutcome !== 'success') {
        lines.push(
            '⚠️ The type-check did not complete successfully, so this comment does not show potentially stale or partial counters.',
            '',
            `Measured for \`${current.sourceSha.slice(0, 7)}\` · ${runLink}`,
        );

        return `${lines.join('\n')}\n`;
    }

    const currentProjectNames = Object.keys(current.projects);

    if (currentProjectNames.length === 0) {
        lines.push(
            'No affected TypeScript projects emitted extended diagnostics.',
            '',
            `Measured for \`${current.sourceSha.slice(0, 7)}\` · ${runLink}`,
        );

        return `${lines.join('\n')}\n`;
    }

    if (baseline === undefined) {
        const currentTotal = sumProjectMetrics({
            projectNames: currentProjectNames,
            projects: current.projects,
        });
        lines.push(
            '⚠️ The develop baseline is not available yet. Current counters are shown without a comparison.',
            '',
            ...createCurrentMetricsTable(currentTotal),
            '',
            `Measured for \`${current.sourceSha.slice(0, 7)}\` · ${runLink}`,
        );

        return `${lines.join('\n')}\n`;
    }

    const comparison = createProjectComparison({ baseline, current });
    lines.push(
        `Compared \`${current.sourceSha.slice(0, 7)}\` with \`develop@${baseline.sourceSha.slice(
            0,
            7,
        )}\` across ${comparison.comparableProjectNames.length} affected project(s).`,
        '',
        ...createMetricComparisonTable({
            baselineMetrics: comparison.baselineTotal,
            currentMetrics: comparison.currentTotal,
        }),
        '',
        '<details>',
        '<summary>Per-project Types and Instantiations</summary>',
        '',
        '| Project | Types change | Instantiations change | Baseline status |',
        '| --- | ---: | ---: | --- |',
        ...comparison.projectRows,
    );

    if (comparison.hiddenProjectCount > 0) {
        lines.push(
            `| … | … | … | ${comparison.hiddenProjectCount} additional project(s) omitted |`,
        );
    }

    lines.push(
        '',
        '</details>',
        '',
        `Measured for \`${current.sourceSha.slice(0, 7)}\` · baseline generated ${baseline.generatedAt} · ${runLink}`,
    );

    return `${lines.join('\n')}\n`;
};

const getRequiredStringOption = ({ optionName, values }) => {
    const value = values[optionName];

    if (typeof value !== 'string' || value.length === 0) {
        throw new Error(`Missing --${optionName}.`);
    }

    return value;
};

const readTextFile = filePath => {
    if (statSync(filePath).size > MAX_LOG_SIZE_BYTES) {
        throw new Error(`File exceeds ${MAX_LOG_SIZE_BYTES} bytes: ${filePath}`);
    }

    return readFileSync(filePath, 'utf8');
};

const readSnapshot = filePath => validateSnapshot(JSON.parse(readTextFile(filePath)));

const writeTextFile = ({ content, filePath }) => {
    writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
};

const runParseCommand = values => {
    const inputPath = getRequiredStringOption({ optionName: 'input', values });
    const outputPath = getRequiredStringOption({ optionName: 'output', values });
    const sourceSha = getRequiredStringOption({ optionName: 'source-sha', values });

    if (!shaPattern.test(sourceSha)) {
        throw new Error('Invalid --source-sha.');
    }

    const snapshot = {
        schemaVersion: SCHEMA_VERSION,
        sourceSha,
        generatedAt: new Date().toISOString(),
        projects: parseTypeScriptExtendedDiagnostics(readTextFile(inputPath)),
    };

    writeTextFile({ content: JSON.stringify(snapshot, null, 2), filePath: outputPath });
};

const runReportCommand = values => {
    const currentPath = getRequiredStringOption({ optionName: 'current', values });
    const outputPath = getRequiredStringOption({ optionName: 'output', values });
    const typeCheckOutcome = getRequiredStringOption({
        optionName: 'type-check-outcome',
        values,
    });
    const workflowRunUrl = getRequiredStringOption({ optionName: 'workflow-run-url', values });
    const baselinePath = values.baseline;
    const baseline =
        typeof baselinePath === 'string' && existsSync(baselinePath)
            ? readSnapshot(baselinePath)
            : undefined;
    const report = createTypeScriptPerformanceReport({
        baseline,
        current: readSnapshot(currentPath),
        typeCheckOutcome,
        workflowRunUrl,
    });

    writeTextFile({ content: report, filePath: outputPath });
};

const main = () => {
    const { positionals, values } = parseArgs({
        args: process.argv.slice(2),
        allowPositionals: true,
        options: {
            baseline: { type: 'string' },
            current: { type: 'string' },
            input: { type: 'string' },
            output: { type: 'string' },
            'source-sha': { type: 'string' },
            'type-check-outcome': { type: 'string' },
            'workflow-run-url': { type: 'string' },
        },
        strict: true,
    });
    const command = positionals[0];

    if (command === 'parse') {
        runParseCommand(values);

        return;
    }

    if (command === 'report') {
        runReportCommand(values);

        return;
    }

    throw new Error('Expected command "parse" or "report".');
};

const isExecutedDirectly =
    process.argv[1] !== undefined &&
    pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isExecutedDirectly) {
    try {
        main();
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
}
