export type NamedAddressProfile = {
    address: string | null;
    texts: Record<string, string>;
};

/** Concerns of the request itself, as opposed to what is being resolved. */
export type NamedAddressResolveOptions = {
    /**
     * Backend identity the lookup rides on. Suite opens one backend connection per identity, so
     * passing the sending account's keeps a recipient lookup on that account's circuit rather
     * than on the shared default one.
     */
    identity?: string;
};

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
    resolveNamedAddress(
        value: string,
        symbol: TSymbol,
        options?: NamedAddressResolveOptions,
    ): Promise<string | null>;

    /** Resolves to `null` when the address has no primary name. */
    reverseResolveAddress(
        address: string,
        symbol: TSymbol,
        options?: NamedAddressResolveOptions,
    ): Promise<string | null>;

    resolveNamedProfile(
        value: string,
        symbol: TSymbol,
        options?: NamedAddressResolveOptions & { textKeys?: readonly string[] },
    ): Promise<NamedAddressProfile>;
};
