import { getActiveTests, getAllQuarantineActions } from '../currentsApi/api';
import type { Action, TestExplorerItem } from '../currentsApi/types';
import { extractKeyFromAction, normalizeTitlePath } from '../quarantineBot/actions';
import { AUTO_QUARANTINE_PREFIX, PROJECTS } from '../quarantineBot/config';

export type RelevantQuarantinedTest = {
    project: string;
    spec: string;
    test: string;
};

export type QuarantineCheck = {
    tests: RelevantQuarantinedTest[];
    unavailableProjects: string[];
    unresolvedActions: number;
};

const EXPLORER_LOOKBACK_DAYS = 30;
const projects = PROJECTS.filter(project => project.name === 'web' || project.name === 'desktop');

const normalizeSpec = (spec: string): string =>
    spec
        .replace(/\\/g, '/')
        .replace(/^\.\//, '')
        .replace(/^suite\/e2e\//, '');

const getActionSpecs = (action: Action): string[] | undefined => {
    if (action.matcher.op !== 'AND' && action.matcher.cond.length !== 1) return;

    const condition = action.matcher.cond.find(
        item => item.type === 'spec' && (item.op === 'eq' || item.op === 'in'),
    );
    if (condition) {
        return Array.isArray(condition.value) ? condition.value : [condition.value];
    }

    // The bot records the spec in its description; manual action names are not reliable paths.
    if (action.name.startsWith(AUTO_QUARANTINE_PREFIX) && extractKeyFromAction(action)) {
        const spec = action.description.match(/^Spec: (.+)$/m)?.[1];
        if (spec) return [spec.trim()];
    }
};

const matchesTitle = (action: Action, test: TestExplorerItem): boolean => {
    if (action.matcher.cond.length !== 1) return false;
    const condition = action.matcher.cond[0];
    if (condition?.type !== 'titlePath' || !Array.isArray(condition.value)) return false;
    const titlePath = normalizeTitlePath(test);
    if (condition.op === 'eq') {
        return (
            condition.value.length === titlePath.length &&
            condition.value.every((part, index) => part === titlePath[index])
        );
    }

    return condition.op === 'incAll' && condition.value.every(part => titlePath.includes(part));
};

export const checkRecommendedQuarantine = async (
    recommendedTests: string[],
): Promise<QuarantineCheck> => {
    const result: QuarantineCheck = { tests: [], unavailableProjects: [], unresolvedActions: 0 };
    if (recommendedTests.length === 0) return result;

    if (!process.env.CURRENTS_API_KEY) {
        result.unavailableProjects = projects.map(project => project.label);

        return result;
    }

    const recommendedSpecs = new Map(recommendedTests.map(spec => [normalizeSpec(spec), spec]));
    const seen = new Set<string>();
    const addTest = (entry: RelevantQuarantinedTest): void => {
        const key = JSON.stringify(entry);
        if (!seen.has(key)) {
            seen.add(key);
            result.tests.push(entry);
        }
    };

    for (const project of projects) {
        try {
            const actions = await getAllQuarantineActions(project.id);
            const unresolved: Action[] = [];
            for (const action of actions) {
                const specs = getActionSpecs(action);
                if (!specs) {
                    unresolved.push(action);
                    continue;
                }
                const titleKey = extractKeyFromAction(action);
                const title = titleKey
                    ? (JSON.parse(titleKey) as string[]).join(' > ')
                    : action.name;
                for (const spec of specs) {
                    const recommendedSpec = recommendedSpecs.get(normalizeSpec(spec));
                    if (recommendedSpec) {
                        addTest({ project: project.label, spec: recommendedSpec, test: title });
                    }
                }
            }

            if (unresolved.length === 0) continue;

            const tests = await getActiveTests(project.id, EXPLORER_LOOKBACK_DAYS);
            for (const action of unresolved) {
                const matches = tests.filter(test => matchesTitle(action, test));
                if (matches.length === 0) result.unresolvedActions++;
                for (const test of matches) {
                    const spec = recommendedSpecs.get(normalizeSpec(test.spec));
                    if (spec) {
                        addTest({
                            project: project.label,
                            spec,
                            test: normalizeTitlePath(test).join(' > '),
                        });
                    }
                }
            }
        } catch {
            result.unavailableProjects.push(project.label);
        }
    }

    return result;
};
