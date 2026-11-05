/**
 * The upstream revision this package is a port of.
 *
 * Before this package existed, the pinned revision was reported at runtime by the
 * `get-version` endpoint of the bundled `WalletWasabi.WabiSabiClientLibrary` binary.
 * That binary is gone, so the pin lives here instead. Every file in `src/` is a
 * faithful port of a file in one of the two trees below; re-syncing to a newer
 * coordinator release means walking the diff of both trees by hand.
 */
export const UPSTREAM = {
    /** https://github.com/trezor/WalletWasabi — branch `release/v15.0`. */
    walletWasabiBranch: 'release/v15.0',
    /** `trezor/WalletWasabi` commit the port was taken from. */
    walletWasabiCommit: '34a0f983',
    /** The `NWabiSabi` submodule commit at that revision. */
    nWabiSabiCommit: '4716ab08e840c13af35479320241ce82bc548de9',
} as const;
