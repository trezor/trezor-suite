/** The token a send moves, described only by what families read from it. */
export type SendToken = {
    readonly contract: string;
    /** The token standard as the backend reports it, such as `ERC20` or `STELLAR-CONTRACT`. */
    readonly standard?: string;
};

/** What a send moves, for options that depend on it. */
export type SendTransfer = {
    /** Absent when the send moves the network's own coin. */
    readonly token?: SendToken;
};
