export type ForbiddenDependency = {
    readonly packageName: string;
    readonly reason: string;
};

export type AllowedOnlyInRule = {
    readonly packages: ReadonlyArray<string>;
    readonly reason: string;
};

export type ForbiddenDepsConfig = {
    readonly 'forbidden-deps'?: ReadonlyArray<ForbiddenDependency>;
    readonly 'allowed-only-in'?: AllowedOnlyInRule;
};
