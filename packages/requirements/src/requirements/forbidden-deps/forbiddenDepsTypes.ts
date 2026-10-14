export type ForbiddenDependency = {
    /** Regular expression matching dependency workspace names. */
    readonly packageNamePattern: string;
    readonly reason: string;
    /** Matching packages that are allowed anyway. */
    readonly except?: ReadonlyArray<string>;
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
    readonly 'forbidden-deps'?: ReadonlyArray<ForbiddenDependency>;
    readonly 'allowed-only-in'?: AllowedOnlyInRule;
    readonly 'forbidden-in'?: ForbiddenInRule;
};
