import { mock } from '@trezor/dependency-injection';

import { installEarlyPerfHook } from './installEarlyPerfHook';
import { PERF_HOOK_GLOBAL_KEY, readPerfHook } from './perfHook';

type ReactHookLike = {
    renderers?: Map<number, unknown>;
    supportsFiber: boolean;
    inject: (renderer: unknown) => number;
    onCommitFiberRoot: (...args: unknown[]) => unknown;
};

type HookWindow = Window & {
    Playwright?: unknown;
    automationTools?: unknown;
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactHookLike;
    [PERF_HOOK_GLOBAL_KEY]?: unknown;
};

const hookWindow = window as HookWindow;

const openGate = () => {
    hookWindow.Playwright = true;
    hookWindow.automationTools = true;
};

describe(installEarlyPerfHook.name, () => {
    afterEach(() => {
        delete hookWindow.Playwright;
        delete hookWindow.automationTools;
        delete hookWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        delete hookWindow[PERF_HOOK_GLOBAL_KEY];
    });

    it('installs nothing while the gate is off', () => {
        hookWindow.Playwright = true;

        expect(installEarlyPerfHook()).toBeUndefined();
        expect(hookWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__).toBeUndefined();
        expect(readPerfHook()).toBeUndefined();
    });

    it('counts renderers and commits through its own hook and resets them', () => {
        openGate();

        const perf = installEarlyPerfHook();
        const reactHook = hookWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__;

        expect(perf).toMatchObject({ wrapped: false, renderers: 0, commits: 0 });
        expect(readPerfHook()).toBe(perf);
        expect(reactHook?.supportsFiber).toBe(true);
        expect(reactHook?.inject({})).toBe(1);
        expect(reactHook?.inject({})).toBe(2);

        reactHook?.onCommitFiberRoot();
        reactHook?.onCommitFiberRoot();

        expect(perf).toMatchObject({ renderers: 2, commits: 2 });
        expect(perf?.commitTimes).toHaveLength(2);

        perf?.reset();

        expect(perf).toMatchObject({ renderers: 2, commits: 0, commitTimes: [] });
    });

    it('wraps a hook another owner installed first and keeps calling it', () => {
        openGate();
        const renderers = new Map<number, unknown>();
        const inject = mock<ReactHookLike['inject']>(renderer => {
            renderers.set(renderers.size + 1, renderer);

            return renderers.size;
        });
        const onCommitFiberRoot = mock<ReactHookLike['onCommitFiberRoot']>(() => undefined);
        const existing: ReactHookLike = {
            renderers,
            supportsFiber: true,
            inject,
            onCommitFiberRoot,
        };
        hookWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__ = existing;

        const perf = installEarlyPerfHook();

        expect(hookWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__).toBe(existing);
        expect(readPerfHook()).toBe(perf);
        expect(perf).toMatchObject({ wrapped: true, renderers: 0, commits: 0 });

        expect(existing.inject({ version: '19' })).toBe(1);
        existing.onCommitFiberRoot(1, {}, undefined, false);

        expect(inject).toHaveBeenCalledWith({ version: '19' });
        expect(onCommitFiberRoot).toHaveBeenCalledWith(1, {}, undefined, false);
        expect(perf).toMatchObject({ renderers: 1, commits: 1 });
    });

    it('answers the counters it installed before instead of installing twice', () => {
        openGate();

        const perf = installEarlyPerfHook();

        expect(installEarlyPerfHook()).toBe(perf);
    });

    it('leaves an object it cannot wrap alone', () => {
        openGate();
        const stranger = { supportsFiber: true } as ReactHookLike;
        hookWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__ = stranger;

        expect(installEarlyPerfHook()).toBeUndefined();
        expect(hookWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__).toBe(stranger);
        expect(readPerfHook()).toBeUndefined();
    });
});
