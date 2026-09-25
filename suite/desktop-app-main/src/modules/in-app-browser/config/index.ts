/**
 * Directory under userData where embedded apps store their persistent data.
 */
export const IN_APP_BROWSER_DIRECTORY = 'in-app-browser';

// No `persist:` prefix — what a non-persisting entry stores never reaches the disk. The name is a
// constant and never derived from a caller's string: `fromPartition('')` would hand the embedded
// page Suite's own default session.
export const IN_APP_BROWSER_SESSION_PARTITION = 'in-app-browser';
