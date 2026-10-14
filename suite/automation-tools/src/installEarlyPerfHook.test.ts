import { installEarlyPerfHook } from './installEarlyPerfHook';
import { PERF_HOOK_GLOBAL_KEY, readPerfHook } from './perfHook';

type ReactHookLike = {
    supportsFiber: boolean;
    inject: (renderer: unknown) => number;
    onCommitFiberRoot: () => void;
};

type HookWindow = Window & {
    Playwright?: unknown;
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactHookLike;
    [PERF_HOOK_GLOBAL_KEY]?: unknown;
};

const hookWindow = window as HookWindow;

describe(installEarlyPerfHook.name, () => {
    afterEach(() => {
        delete hookWindow.Playwright;
        delete hookWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        delete hookWindow[PERF_HOOK_GLOBAL_KEY];
    });

    it('installs nothing while the gate is off', () => {
        expect(installEarlyPerfHook()).toBeUndefined();
        expect(hookWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__).toBeUndefined();
        expect(readPerfHook()).toBeUndefined();
    });

    it('leaves a hook that is already installed alone', () => {
        hookWindow.Playwright = true;
        const existing: ReactHookLike = {
            supportsFiber: true,
            inject: () => 1,
            onCommitFiberRoot: () => {},
        };
        hookWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__ = existing;

        expect(installEarlyPerfHook()).toBeUndefined();
        expect(hookWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__).toBe(existing);
        expect(readPerfHook()).toBeUndefined();
    });

    it('counts renderers and commits through the minimal hook and resets them', () => {
        hookWindow.Playwright = true;

        const perf = installEarlyPerfHook();
        const reactHook = hookWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__;

        expect(perf).toBeDefined();
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
});
