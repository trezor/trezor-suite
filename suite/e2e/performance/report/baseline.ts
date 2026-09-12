import { median } from '@trezor/perf-e2e';

import { Lhr } from './collect';
import { LhciBuild, LhciClient, LhciProject } from './lhciClient';

/**
 * What the current run is compared against: the latest sealed build of the base branch, reduced to
 * per-URL, per-audit medians. Medians are computed client-side — the server's own representative-run
 * selection keys on FCP, which every timespan LHR lacks, so it degenerates there.
 */

export type Baseline = {
    build: LhciBuild;
    /** Median audit numericValue, keyed by synthetic URL then audit id. */
    medians: Map<string, Map<string, number>>;
};

export const fetchBaseline = async ({
    client,
    project,
    baseBranch,
}: {
    client: LhciClient;
    project: LhciProject;
    baseBranch: string;
}): Promise<Baseline | null> => {
    // Degrading to absolute values is this function returning null — the report stays useful even
    // when the nightly failed all week or the server is gone.
    try {
        const build = await client.getLatestSealedBuild(project.id, baseBranch);
        if (!build) {
            return null;
        }

        const runs = await client.getRuns(project.id, build.id);
        const valuesByUrl = new Map<string, Map<string, number[]>>();

        for (const run of runs) {
            let lhr: Lhr;
            try {
                lhr = JSON.parse(run.lhr) as Lhr;
            } catch {
                continue;
            }

            const byAudit = valuesByUrl.get(run.url) ?? new Map<string, number[]>();
            valuesByUrl.set(run.url, byAudit);

            for (const audit of Object.values(lhr.audits ?? {})) {
                if (typeof audit.numericValue !== 'number') {
                    continue;
                }
                byAudit.set(audit.id, [...(byAudit.get(audit.id) ?? []), audit.numericValue]);
            }
        }

        const medians = new Map<string, Map<string, number>>();
        for (const [url, byAudit] of valuesByUrl) {
            medians.set(
                url,
                new Map([...byAudit].map(([auditId, values]) => [auditId, median(values)])),
            );
        }

        return { build, medians };
    } catch {
        return null;
    }
};
