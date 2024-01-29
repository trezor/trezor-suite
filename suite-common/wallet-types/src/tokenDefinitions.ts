export type TokenDefinitions = {
    [contractAddress: string]: TokenDefinition;
};

export type TokenDefinition = {
    isTokenKnown: boolean | undefined;
    error: boolean;
};
