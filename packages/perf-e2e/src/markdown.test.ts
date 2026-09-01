import {
    type ReportedMeasurement,
    formatMarkdownReport,
    mergeMeasurements,
    perfReportComment,
    readSectionMeasurements,
} from './markdown';

const measurement = (key: string, current = 100): ReportedMeasurement => ({
    key,
    runs: 1,
    report: {
        scenario: key,
        overLimit: false,
        unlimited: false,
        metrics: [
            {
                key: 'totalBlockingTimeMs',
                label: 'Total Blocking Time',
                unit: 'ms',
                baseline: 90,
                current,
                limit: 200,
                ratioToLimit: current / 200,
                exceededLimit: false,
            },
        ],
    },
});

const LABEL = 'desktop / group 1';

const publish = (existingBody: string | undefined, measurements: ReportedMeasurement[]) =>
    perfReportComment({
        existingBody,
        label: LABEL,
        section: formatMarkdownReport(
            mergeMeasurements(
                readSectionMeasurements({ body: existingBody, label: LABEL }),
                measurements,
            ),
            { heading: LABEL },
        ),
    });

describe(readSectionMeasurements.name, () => {
    it('reads back what a section was rendered from', () => {
        const body = publish(undefined, [measurement('wallet-discovery')]);

        expect(readSectionMeasurements({ body, label: LABEL })).toEqual([
            measurement('wallet-discovery'),
        ]);
    });

    it('reads nothing from a body without the section', () => {
        expect(readSectionMeasurements({ body: 'nothing here', label: LABEL })).toEqual([]);
    });

    it('reads nothing from another label, so sections cannot bleed into one another', () => {
        const body = publish(undefined, [measurement('wallet-discovery')]);

        expect(readSectionMeasurements({ body, label: 'web / group 2' })).toEqual([]);
    });
});

describe(mergeMeasurements.name, () => {
    it('keeps what was reported before and adds what is new', () => {
        expect(
            mergeMeasurements([measurement('account-switch')], [measurement('wallet-discovery')]),
        ).toEqual([measurement('account-switch'), measurement('wallet-discovery')]);
    });

    it('lets the newer measurement of a scenario win', () => {
        expect(
            mergeMeasurements(
                [measurement('account-switch', 100)],
                [measurement('account-switch', 300)],
            ),
        ).toEqual([measurement('account-switch', 300)]);
    });
});

// The orchestrator runs a Playwright process per test file, so one job publishes several times under
// the same section label, each time knowing only its own file's scenarios.
describe('publishing a section twice', () => {
    it('holds the scenarios of both publishes', () => {
        const first = publish(undefined, [measurement('multi-account-discovery')]);
        const second = publish(first, [measurement('wallet-discovery')]);

        expect(second).toContain('multi-account-discovery');
        expect(second).toContain('wallet-discovery');
        expect(
            readSectionMeasurements({ body: second, label: LABEL }).map(({ key }) => key),
        ).toEqual(['multi-account-discovery', 'wallet-discovery']);
    });

    it('renders one section, not one per publish', () => {
        const second = publish(publish(undefined, [measurement('a')]), [measurement('b')]);

        expect(second.match(/PERF-E2E-SECTION:[^:]+:START/g)).toHaveLength(1);
    });

    it('leaves the section of another job alone', () => {
        const other = perfReportComment({
            existingBody: undefined,
            label: 'web / group 2',
            section: formatMarkdownReport([measurement('web-scenario')], {
                heading: 'web / group 2',
            }),
        });
        const body = publish(other, [measurement('wallet-discovery')]);

        expect(
            readSectionMeasurements({ body, label: 'web / group 2' }).map(({ key }) => key),
        ).toEqual(['web-scenario']);
    });
});
