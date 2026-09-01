/**
 * Resolution between human-readable names and onchain addresses (ENS and its equivalents).
 *
 * Optional on a network module: most networks have no name system, and those that do usually run
 * it on a subset of their symbols only — hence the per-symbol `supportsNamedAddress`.
 */
export type NamedAddressResolver<TSymbol extends string> = {
    supportsNamedAddress(symbol: TSymbol): boolean;

    /** Shape check: a value the user may have meant as a name, not a promise that it resolves. */
    isNameLike(value: string): boolean;

    /** Shape check only — checksums are not enforced, so a lowercase paste still qualifies. */
    isAddressLike(value: string): boolean;

    /** Resolves to `null` when the name exists but holds no address record. */
    resolveNamedAddress(value: string, symbol: TSymbol): Promise<string | null>;

    /** Resolves to `null` when the address has no primary name. */
    reverseResolveAddress(address: string, symbol: TSymbol): Promise<string | null>;
};
