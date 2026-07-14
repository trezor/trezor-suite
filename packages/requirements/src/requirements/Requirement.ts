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

    /**
     * Controls whether the requirement runs once for the repository
     * or for each affected workspace.
     **/
    readonly scope: T;

    /**
     * Controls whether the requirement runs without an explicit
     * `--only` selection. Defaults to `true`.
     *
     * Useful for cases when the requirements needs to be run at some
     * specific point int the CI (for example after type-check).
     **/
    readonly runByDefault?: boolean;

    readonly applies?: (context: WorkspaceContext) => boolean;

    readonly verify: (
        context: T extends 'workspace' ? WorkspaceContext : RepoContext,
    ) => Promise<ReadonlyArray<string>>;

    readonly fix?: (
        context: T extends 'workspace' ? WorkspaceContext : RepoContext,
    ) => Promise<ReadonlyArray<string>>;
};
