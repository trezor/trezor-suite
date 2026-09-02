import { basename } from 'node:path';
import { performance } from 'node:perf_hooks';

import type {
    RepoContext,
    Requirement,
    RequirementMode,
    RequirementScope,
    WorkspaceContext,
} from './requirements/Requirement';

export type RequirementResult = {
    readonly requirement: string;
    readonly target: string;
    readonly errors: ReadonlyArray<string>;
    readonly durationMs: number;
};

type RunRequirementsProps = {
    readonly requirements: ReadonlyArray<Requirement<RequirementScope>>;
    readonly repoRoot: string;
    readonly workspaces?: ReadonlyArray<{ readonly dir: string; readonly name: string }>;
    readonly filter?: string;
    readonly mode: RequirementMode;
    readonly now?: () => number;
};

type ExecuteRequirementProps<T extends RequirementScope> = {
    readonly requirement: Requirement<T>;
    readonly context: T extends 'workspace' ? WorkspaceContext : RepoContext;
    readonly mode: RequirementMode;
};

const executeRequirement = <T extends RequirementScope>({
    requirement,
    context,
    mode,
}: ExecuteRequirementProps<T>): Promise<ReadonlyArray<string>> => {
    if (mode === 'fix') {
        if (requirement.fix !== undefined) {
            return requirement.fix(context);
        }
    }

    return requirement.verify(context);
};

export const runRequirements = async ({
    requirements,
    repoRoot,
    workspaces = [],
    filter,
    mode,
    now = () => performance.now(),
}: RunRequirementsProps): Promise<ReadonlyArray<RequirementResult>> => {
    const filtered = requirements.filter(requirement =>
        filter !== undefined ? requirement.name === filter : requirement.runByDefault !== false,
    );

    const results: RequirementResult[] = [];

    for (const requirement of filtered) {
        if (requirement.scope === 'repo') {
            const startedAt = now();
            const errors = await executeRequirement({
                requirement,
                context: { repoRoot },
                mode,
            });
            const durationMs = now() - startedAt;

            results.push({
                requirement: requirement.name,
                target: 'repo',
                errors,
                durationMs,
            });
        } else {
            for (const workspace of workspaces) {
                const context: WorkspaceContext = {
                    repoRoot,
                    workspaceDir: workspace.dir,
                    workspaceName: workspace.name,
                };

                if (requirement.applies !== undefined && !requirement.applies(context)) {
                    continue;
                }

                const startedAt = now();
                const errors = await executeRequirement({
                    requirement,
                    context,
                    mode,
                });
                const durationMs = now() - startedAt;

                results.push({
                    requirement: requirement.name,
                    target: basename(workspace.dir),
                    errors,
                    durationMs,
                });
            }
        }
    }

    return results;
};
