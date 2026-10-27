// Defined in `@trezor/requirements`; this module keeps the import path of the connect release
// scripts. These four are released by `deploy-npm-connect` (a hardcoded matrix), not by
// `deploy-npm-connect-dependencies`, which releases the rest of the closure.
export { CONNECT_PUBLISH_ROOTS } from './publish-closure';
