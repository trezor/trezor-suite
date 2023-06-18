import desktopUpdateReducer, { State, UpdateState } from '../desktopUpdateReducer';
import { DESKTOP_UPDATE, SUITE } from 'src/actions/suite/constants';
import type { Action } from 'src/types/suite';

const createUpdateInfo = (salt: string) => ({
    releaseDate: `releaseDate-${salt}`,
    version: `version-${salt}`,
});

const fixtures: [Action, Partial<State>][] = [
    [
        {
            type: SUITE.DESKTOP_HANDSHAKE,
            // @ts-expect-error
            payload: {
                desktopUpdate: {
                    allowPrerelease: true,
                },
            },
        },
        { enabled: true, allowPrerelease: true },
    ],
    [{ type: DESKTOP_UPDATE.ALLOW_PRERELEASE, payload: false }, { allowPrerelease: false }],
    [{ type: DESKTOP_UPDATE.CHECKING }, { state: UpdateState.Checking }],
    [
        { type: DESKTOP_UPDATE.AVAILABLE, payload: createUpdateInfo('a') },
        { state: UpdateState.Available, latest: createUpdateInfo('a') },
    ],
    [
        { type: DESKTOP_UPDATE.NOT_AVAILABLE, payload: createUpdateInfo('b') },
        { state: UpdateState.NotAvailable, latest: createUpdateInfo('b') },
    ],
    [{ type: DESKTOP_UPDATE.DOWNLOAD }, { state: UpdateState.Downloading }],
    [{ type: DESKTOP_UPDATE.DOWNLOADING, payload: { percent: 42 } }, { progress: { percent: 42 } }],
    [
        { type: DESKTOP_UPDATE.READY, payload: createUpdateInfo('c') },
        { state: UpdateState.Ready, latest: createUpdateInfo('c') },
    ],
    [
        { type: DESKTOP_UPDATE.OPEN_EARLY_ACCESS_ENABLE },
        { state: UpdateState.EarlyAccessEnable, window: 'maximized' },
    ],
    [{ type: DESKTOP_UPDATE.WINDOW, payload: 'minimized' }, { window: 'minimized' }],

    [
        { type: DESKTOP_UPDATE.OPEN_EARLY_ACCESS_DISABLE },
        { state: UpdateState.EarlyAccessDisable, window: 'maximized' },
    ],
];

describe('desktopUpdateReducer', () => {
    it('DESKTOP_UPDATE actions', () => {
        let lastState: State | undefined;
        fixtures.forEach(([action, state]) => {
            lastState = desktopUpdateReducer(lastState, action);
            expect(lastState).toMatchObject(state);
        });
    });
});
