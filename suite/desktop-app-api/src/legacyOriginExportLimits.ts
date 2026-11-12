/**
 * At most this many records of an object store travel in one message of the legacy-origin export page.
 * It lives apart from the schemas, so the page's preload can use it without bundling zod.
 */
export const LEGACY_ORIGIN_RECORDS_PER_MESSAGE = 2000;
