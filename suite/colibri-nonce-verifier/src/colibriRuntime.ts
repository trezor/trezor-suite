import type { C4Runtime } from '@corpus-core/colibri-stateless';
import colibriPackage from '@corpus-core/colibri-stateless/package.json';

import type { ColibriStorage } from './storage';

export type ColibriRuntimeKind = 'native' | 'wasm';

// `getRuntime` from `@corpus-core/colibri-stateless`, injected by the process that hosts the
// verifier so this package never loads Colibri on its own (the main process, for one, must not).
export type GetColibriRuntime = () => Promise<C4Runtime>;

export type ColibriRuntimeHandle = {
    runtime: C4Runtime;
    kind: ColibriRuntimeKind;
    revision: string;
};

export type LoadColibriRuntimeResult =
    | { success: true; handle: ColibriRuntimeHandle }
    | { success: false; code: 'NATIVE_UNAVAILABLE'; detail: string };

export type LoadColibriRuntimeParams = {
    getRuntime: GetColibriRuntime;
    storage: ColibriStorage;
    // Production passes ['native'] only; the WASM build is for fixture tests on hosts without a
    // matching prebuild. It is never selectable through IPC.
    allowedRuntimeKinds: readonly ColibriRuntimeKind[];
};

export const COLIBRI_REVISION = colibriPackage.version;

// Colibri picks its runtime from environment variables at first use. They are pinned here so an
// inherited variable can neither point the addon loader at an arbitrary file nor switch to WASM.
const pinRuntimeEnvironment = (allowedRuntimeKinds: readonly ColibriRuntimeKind[]) => {
    delete process.env.C4_NATIVE_ADDON;
    delete process.env.C4_DEBUG_NATIVE;
    delete process.env.C4_FORCE_NATIVE;
    delete process.env.C4_DISABLE_NATIVE;
    if (!allowedRuntimeKinds.includes('wasm')) process.env.C4_FORCE_NATIVE = '1';
    if (!allowedRuntimeKinds.includes('native')) process.env.C4_DISABLE_NATIVE = '1';
};

export const loadColibriRuntime = async ({
    getRuntime,
    storage,
    allowedRuntimeKinds,
}: LoadColibriRuntimeParams): Promise<LoadColibriRuntimeResult> => {
    pinRuntimeEnvironment(allowedRuntimeKinds);
    try {
        const runtime = await getRuntime();
        if (!allowedRuntimeKinds.includes(runtime.kind)) {
            return {
                success: false,
                code: 'NATIVE_UNAVAILABLE',
                detail: `runtime kind ${runtime.kind} not permitted`,
            };
        }
        // Replaces Colibri's default Node storage, which writes sync state relative to cwd.
        runtime.registerStorage(storage);

        return {
            success: true,
            handle: { runtime, kind: runtime.kind, revision: COLIBRI_REVISION },
        };
    } catch (error) {
        return {
            success: false,
            code: 'NATIVE_UNAVAILABLE',
            detail: error instanceof Error ? error.message : String(error),
        };
    }
};
