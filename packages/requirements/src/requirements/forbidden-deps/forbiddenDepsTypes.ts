type ForbiddenDependencyBase = {
    readonly reason: string;
};

type ExactForbiddenDependency = ForbiddenDependencyBase & {
    readonly packageName: string;
    readonly packageNamePrefix?: never;
    readonly packageNamePattern?: never;
};

type PrefixForbiddenDependency = ForbiddenDependencyBase & {
    readonly packageName?: never;
    readonly packageNamePrefix: string;
    readonly packageNamePattern?: never;
};

type PatternForbiddenDependency = ForbiddenDependencyBase & {
    readonly packageName?: never;
    readonly packageNamePrefix?: never;
    /** Regular expression source, without slash delimiters or flags. */
    readonly packageNamePattern: string;
};

export type ForbiddenDependency =
    ExactForbiddenDependency | PrefixForbiddenDependency | PatternForbiddenDependency;

export type AllowedOnlyInRule = {
    readonly packages: ReadonlyArray<string>;
    readonly reason: string;
};

export type ForbiddenDepsConfig = {
    readonly 'forbidden-deps'?: ReadonlyArray<ForbiddenDependency>;
    readonly 'allowed-only-in'?: AllowedOnlyInRule;
};
