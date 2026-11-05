// wardd: the WARD host -- the flows, proofs, storage and WM a host library relays to.
// `Wardd` is the in-process service (what Connect is given); `startServer` serves it to other
// processes (HWI) and `WarddClient` reaches a running one. `EvoluWardStorage` is Node only.
export { Wardd, type WarddOptions } from './service';
export { WardHost, type Log } from './host';
export { HttpWm, MockWm, WmConflict, type WmClient } from './wm';
export { buildProofAck } from './proofs';
export { DEFAULT_ORIGINS, DEFAULT_PORT, startServer, type ServerOptions } from './server';
export { WARDD_DEFAULT_URL, WarddClient, type WarddClientOptions } from './client';
export { EvoluWardStorage, wardOwner, wardOwnerSecret } from './evoluStorage';
