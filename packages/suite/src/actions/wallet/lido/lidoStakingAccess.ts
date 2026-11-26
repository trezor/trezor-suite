import { type DebugRootState, selectIsDebugModeActive } from '@suite/debug';

// TODO: Lido staking is a proof of concept that moves real funds on mainnet. Until it is released
// behind its own remote switch, the debug mode is its opt-in: the Earn rows, the Lido pages and
// the submit of a Lido transaction all stay closed without it.
export const selectIsLidoStakingEnabled = (state: DebugRootState) => selectIsDebugModeActive(state);
