/**
 * WARD command registry for @trezor/connect-cli.
 *
 * OWNS: the *declaration* of the WARD commands the CLI offers — their names, help
 * text, the input keys each one needs, and whether they accept `--queue`.
 *
 * `requiredParams` / `optionalParams` name keys of the INPUT OBJECT, which `index.ts`
 * builds from `--params` JSON overlaid with the recognised WARD flags. So `scope` comes
 * from JSON while `appid` / `ident` / `entry` come from flags, and this file does not
 * have to know which spelling a caller used.
 *
 * MUST NOT: talk to a device, to @trezor/connect or to the WARD Manager. Every
 * `run` here is an unwired stub on purpose; wiring the calls is a separate step,
 * so the registry stays the single place where command shape is defined.
 */

export const WARD_COMMAND_NAMES = [
    'ward_add',
    'ward_update',
    'ward_delete',
    'ward_display',
    'ward_backup',
    'ward_restore',
    'ward_flush',
    'ward_reset_app',
] as const;

export type WardCommandName = (typeof WARD_COMMAND_NAMES)[number];

export type WardCommandContext = {
    /**
     * `--queue`: stay offline. The command only places its change into the local
     * pending queue (or, for `ward_display`, only looks the entry up there) and
     * never runs a device round / WARD Manager exchange.
     */
    queue: boolean;
    /** Parsed `--params` JSON object. */
    params: Record<string, any>;
};

export type WardCommand = {
    name: WardCommandName;
    /** One-line description, used by `--help`. */
    description: string;
    /** `--params` keys the command cannot run without. */
    requiredParams: string[];
    /** `--params` keys the command uses when present. */
    optionalParams: string[];
    /** Whether `--queue` is meaningful for this command. */
    supportsQueue: boolean;
    run: (context: WardCommandContext) => Promise<unknown>;
};

const notWired =
    (name: WardCommandName): WardCommand['run'] =>
    () =>
        Promise.reject(new Error(`${name} is registered but not wired yet`));

export const wardCommands: Record<WardCommandName, WardCommand> = {
    ward_add: {
        name: 'ward_add',
        description: 'Insert a new WARD entry (--queue to hold it, --service to publish it)',
        requiredParams: ['ident', 'value'],
        optionalParams: ['appid', 'ward_id', 'service'],
        supportsQueue: true,
        run: notWired('ward_add'),
    },
    ward_update: {
        name: 'ward_update',
        description: 'Update the value of an existing WARD entry',
        requiredParams: ['ident', 'value'],
        optionalParams: ['appid', 'ward_id'],
        supportsQueue: true,
        run: notWired('ward_update'),
    },
    ward_delete: {
        name: 'ward_delete',
        description: 'Delete a WARD entry, or with --queue discard a queued change',
        requiredParams: ['ident'],
        optionalParams: ['appid', 'ward_id'],
        supportsQueue: true,
        run: notWired('ward_delete'),
    },
    ward_display: {
        name: 'ward_display',
        description: "Show what the device holds for an entry (--queue: the device's own store)",
        // Named in full, like ward_backup: the offline read is a lookup in the device's store, and
        // a store keyed by (app_id, identifier) cannot answer half a key. The registry used to
        // require neither, which made a missing --appid present as "nothing kept for this path".
        requiredParams: ['appid', 'ident'],
        optionalParams: ['ward_id', 'service'],
        supportsQueue: true,
        run: notWired('ward_display'),
    },
    ward_backup: {
        name: 'ward_backup',
        description: "Export a queued change from the device's own store, as 0x...",
        requiredParams: ['appid', 'ident'],
        optionalParams: ['target'],
        supportsQueue: true,
        run: notWired('ward_backup'),
    },
    ward_restore: {
        name: 'ward_restore',
        description: 'Put a backed-up change (0x...) back into the queue',
        requiredParams: ['entry'],
        optionalParams: [],
        supportsQueue: true,
        run: notWired('ward_restore'),
    },
    ward_flush: {
        name: 'ward_flush',
        description: 'Publish ONE change the device is holding, and say how many are left',
        // NOTHING IS REQUIRED, and that is the command's shape rather than an omission: unnamed, the
        // device publishes whatever is next in its own queue, which is the ordinary way to drain
        // one. Naming an entry is for the case the device cannot resolve itself -- a COMPACT record
        // keeps a hash of its identity, and a hash cannot be turned back into a keyed path.
        requiredParams: [],
        optionalParams: ['appid', 'ident', 'service'],
        // `--queue` IS THE OPPOSITE OF THIS COMMAND. Every other command here can operate on the
        // device's own store alone; publishing is the act of leaving it, so there is no offline
        // form to ask for and the flag is rejected rather than ignored.
        supportsQueue: false,
        run: notWired('ward_flush'),
    },
    ward_reset_app: {
        name: 'ward_reset_app',
        description: 'Retire the pinned WARD app, so the next one to ask may claim the role',
        // NOTHING AT ALL, and that is the shape of the request: it names no entry, because its
        // subject is who may operate WARD rather than what they may reach. It is also the one WARD
        // command that does not need the role it is about -- see the runner.
        requiredParams: [],
        optionalParams: [],
        supportsQueue: false,
        run: notWired('ward_reset_app'),
    },
};

export const isWardCommand = (name?: unknown): name is WardCommandName =>
    typeof name === 'string' && WARD_COMMAND_NAMES.includes(name as WardCommandName);

export const getWardCommand = (name?: unknown): WardCommand | undefined =>
    isWardCommand(name) ? wardCommands[name] : undefined;

/** Names of `requiredParams` missing from the assembled inputs, for an early, readable error. */
export const missingWardParams = (command: WardCommand, params: Record<string, any>): string[] =>
    command.requiredParams.filter(key => params[key] === undefined);
