// @suite/dapp-browser — in-app EVM dApp browser for Suite Desktop (Phase-1 PoC).
//
// This feature package owns the portable, platform-agnostic core: EIP-1193/6963
// types + Zod schemas, per-namespace RPC method-classification, the curated
// catalog, and (added in later milestones) the ephemeral-grant slice, the
// React-free provider injection script, and the renderer hooks + UI.
//
// The desktop Electron host (`packages/suite-desktop-core`) imports the
// React-free modules from here; the app packages wire the route + flag.

export type * from './types';
export * from './constants';
export * from './schemas';
export * from './methodClassification';
export * from './catalog';
