export type RequirementScope = 'repo' | 'workspace';

export type RequirementMode = 'verify' | 'fix';

export type RepoContext = {
    readonly repoRoot: string;
};

export type WorkspaceContext = {
    readonly repoRoot: string;
    readonly workspaceDir: string;
    readonly workspaceName: string;
};

export type RequirementContext = RepoContext | WorkspaceContext;

export type Requirement<T extends RequirementScope> = {
    readonly name: string;
    readonly scope: T;

    readonly applies?: (context: WorkspaceContext) => boolean;

    readonly verify: (
        context: T extends 'workspace' ? WorkspaceContext : RepoContext,
    ) => Promise<ReadonlyArray<string>>;

    readonly fix?: (
        context: T extends 'workspace' ? WorkspaceContext : RepoContext,
    ) => Promise<ReadonlyArray<string>>;
};
