type ForbiddenDependencyBase = {
    readonly reason: string;
};

type ExactForbiddenDependency = ForbiddenDependencyBase & {
    readonly packageName: string;
    readonly packageNamePrefix?: never;
};

type PrefixForbiddenDependency = ForbiddenDependencyBase & {
    readonly packageName?: never;
    readonly packageNamePrefix: string;
    /** Packages matching the prefix that are allowed anyway. */
    readonly except?: ReadonlyArray<string>;
};

export type ForbiddenDependency = ExactForbiddenDependency | PrefixForbiddenDependency;

export type AllowedDepsRule = {
    /** Workspace dependencies have to match one of these prefixes. */
    readonly packageNamePrefixes: ReadonlyArray<string>;
    /** Workspace packages allowed despite not matching a prefix. */
    readonly except?: ReadonlyArray<string>;
    readonly reason: string;
};

export type AllowedOnlyInRule = {
    readonly packages: ReadonlyArray<string>;
    readonly reason: string;
};

export type ForbiddenInRule = {
    /** Regular expression matching consumer workspace names. */
    readonly packageNamePattern: string;
    readonly reason: string;
};

export type ForbiddenDepsConfig = {
    readonly 'allowed-deps'?: AllowedDepsRule;
    readonly 'forbidden-deps'?: ReadonlyArray<ForbiddenDependency>;
    readonly 'allowed-only-in'?: AllowedOnlyInRule;
    readonly 'forbidden-in'?: ForbiddenInRule;
};
