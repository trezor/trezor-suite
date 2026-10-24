// The connect distribution packages. Used both as BFS roots to compute the
// @trezor/* publish dep closure (`gen-workflow-paths.ts`), and as the exclude
// list for the release output (`get-connect-dependencies-to-release.ts`) —
// these four are released by `deploy-npm-connect` (a hardcoded matrix), not by
// `deploy-npm-connect-dependencies` (which consumes that script's output).
export const CONNECT_PUBLISH_ROOTS = [
    'connect',
    'connect-web',
    'connect-mobile',
    'connect-webextension',
];
