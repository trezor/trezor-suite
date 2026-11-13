/* eslint-disable @typescript-eslint/no-restricted-imports -- The one place that imports zod itself. */
import { config } from 'zod';

/**
 * Zod probes `new Function` when it constructs an object schema, to decide whether to JIT-compile its parser.
 * Under a CSP without 'unsafe-eval' the probe is caught, but the browser still reports it as a violation.
 * The setting is global to the realm and is read when a schema is constructed, so it has to run before
 * the importing module builds its schemas, which ES module evaluation order guarantees.
 */
config({ jitless: true });

export * from 'zod';
export * as z from 'zod';
