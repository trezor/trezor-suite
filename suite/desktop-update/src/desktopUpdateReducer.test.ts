import type { HandshakeElectron } from '@trezor/suite-desktop-api';

import {
    UpdateState,
    desktopUpdateActions,
    desktopUpdateReducer,
    openEarlyAccessSetup,
} from './desktopUpdateReducer';
import type { DesktopUpdateState } from './desktopUpdateReducer';

const createUpdateInfo = (salt: string) => ({
    releaseDate: `releaseDate-${salt}`,
    version: `version-${salt}`,
});

const createDesktopHandshakeAction = (desktopUpdate?: HandshakeElectron['desktopUpdate']) => ({
    type: '@suite/desktop-handshake' as const,
    payload: {
        desktopUpdate,
        paths: { userDir: '', binDir: '' },
        urls: { httpReceiver: '' },
    } satisfies HandshakeElectron,
});

type DesktopUpdateReducerAction =
    | ReturnType<(typeof desktopUpdateActions)[keyof typeof desktopUpdateActions]>
    | ReturnType<typeof createDesktopHandshakeAction>;

const fixtures: [DesktopUpdateReducerAction, Partial<DesktopUpdateState>][] = [
    [
        createDesktopHandshakeAction({
            allowPrerelease: true,
            isAutomaticUpdateEnabled: false,
        }),
        { enabled: true, allowPrerelease: true },
    ],
    [desktopUpdateActions.allowPrerelease(false), { allowPrerelease: false }],
    [desktopUpdateActions.checking(), { state: UpdateState.Checking }],
    [
        desktopUpdateActions.available(createUpdateInfo('a')),
        { state: UpdateState.Available, latest: createUpdateInfo('a') },
    ],
    [
        desktopUpdateActions.notAvailable(createUpdateInfo('b')),
        { state: UpdateState.NotAvailable, latest: createUpdateInfo('b') },
    ],
    [desktopUpdateActions.download(), { state: UpdateState.Downloading }],
    [desktopUpdateActions.downloading({ percent: 42 }), { progress: { percent: 42 } }],
    [
        desktopUpdateActions.ready(createUpdateInfo('c')),
        { state: UpdateState.Ready, latest: createUpdateInfo('c') },
    ],
    [openEarlyAccessSetup(false), { state: UpdateState.EarlyAccessEnable, isModalVisible: true }],
    [desktopUpdateActions.setIsUpdateModalVisible(false), { isModalVisible: false }],
    [openEarlyAccessSetup(true), { state: UpdateState.EarlyAccessDisable, isModalVisible: true }],
];

describe('desktopUpdateReducer', () => {
    it('handles desktop update actions', () => {
        let lastState: DesktopUpdateState | undefined;

        fixtures.forEach(([action, state]) => {
            lastState = desktopUpdateReducer(lastState, action);
            expect(lastState).toMatchObject(state);
        });
    });
});
