import { basename } from 'node:path';

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
};

type RunRequirementsProps = {
    readonly requirements: ReadonlyArray<Requirement<RequirementScope>>;
    readonly repoRoot: string;
    readonly workspaces?: ReadonlyArray<{ readonly dir: string; readonly name: string }>;
    readonly filter?: string;
    readonly mode: RequirementMode;
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
}: RunRequirementsProps): Promise<ReadonlyArray<RequirementResult>> => {
    const filtered =
        filter !== undefined ? requirements.filter(r => r.name === filter) : requirements;

    const results: RequirementResult[] = [];

    for (const requirement of filtered) {
        if (requirement.scope === 'repo') {
            const errors = await executeRequirement({
                requirement,
                context: { repoRoot },
                mode,
            });

            results.push({
                requirement: requirement.name,
                target: 'repo',
                errors,
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

                const errors = await executeRequirement({
                    requirement,
                    context,
                    mode,
                });

                results.push({
                    requirement: requirement.name,
                    target: basename(workspace.dir),
                    errors,
                });
            }
        }
    }

    return results;
};
