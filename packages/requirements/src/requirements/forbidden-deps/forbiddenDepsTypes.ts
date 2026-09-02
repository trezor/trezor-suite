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
};

export type ForbiddenDependency = ExactForbiddenDependency | PrefixForbiddenDependency;

export type AllowedOnlyInRule = {
    readonly packages: ReadonlyArray<string>;
    readonly reason: string;
};

export type ForbiddenDepsConfig = {
    readonly 'forbidden-deps'?: ReadonlyArray<ForbiddenDependency>;
    readonly 'allowed-only-in'?: AllowedOnlyInRule;
};
