import { Provider } from 'react-redux';

import { render } from '@testing-library/react';

import { MODAL_CONTEXT_NONE, MODAL_CONTEXT_USER, type State as ModalState } from '@suite/modal';
import { type PathString, getAppWithParams } from '@suite/router';
import { configureMockStore } from '@suite-common/test-utils';

import { usePreferredModal } from './usePreferredModal';

type Result = ReturnType<typeof usePreferredModal>;

const NO_MODAL: ModalState = { context: MODAL_CONTEXT_NONE };
const USER_MODAL = {
    context: MODAL_CONTEXT_USER,
    payload: { type: 'application-log' },
} as ModalState;

const DEFAULT_MODAL_APP_PARAMS = { cancelable: true, variant: undefined };

const renderPreferredModal = ({
    pathname,
    hash = '',
    modal = NO_MODAL,
}: {
    pathname: PathString;
    hash?: '' | `#${string}`;
    modal?: ModalState;
}) => {
    const store = configureMockStore({
        extra: undefined,
        preloadedState: {
            router: { loaded: true, ...getAppWithParams({ pathname, hash }) },
            modal,
        },
    });

    let result: Result | undefined;

    const Component = () => {
        result = usePreferredModal();

        return null;
    };

    const { unmount } = render(
        <Provider store={store}>
            <Component />
        </Provider>,
    );
    unmount();

    return result;
};

describe('usePreferredModal', () => {
    it('prefers nothing on a regular route without a redux modal', () => {
        expect(renderPreferredModal({ pathname: '/settings' })).toEqual({ type: 'none' });
    });

    it('prefers the redux modal on a regular route', () => {
        expect(renderPreferredModal({ pathname: '/settings', modal: USER_MODAL })).toEqual({
            type: 'redux-modal',
            payload: USER_MODAL,
        });
    });

    it('prefers a prioritized foreground app over the redux modal', () => {
        expect(renderPreferredModal({ pathname: '/firmware', modal: USER_MODAL })).toEqual({
            type: 'foreground-app',
            payload: { ...DEFAULT_MODAL_APP_PARAMS, app: 'firmware', cancelable: true },
        });
    });

    it('prefers the redux modal over a foreground app without priority', () => {
        expect(renderPreferredModal({ pathname: '/switch-device', modal: USER_MODAL })).toEqual({
            type: 'redux-modal',
            payload: USER_MODAL,
        });
        expect(renderPreferredModal({ pathname: '/backup', modal: USER_MODAL })).toEqual({
            type: 'redux-modal',
            payload: USER_MODAL,
        });
    });

    it('prefers a foreground app without priority when there is no redux modal', () => {
        expect(renderPreferredModal({ pathname: '/switch-device' })).toEqual({
            type: 'foreground-app',
            payload: { ...DEFAULT_MODAL_APP_PARAMS, app: 'switch-device', cancelable: true },
        });
    });

    it('passes the route params through and reads cancelable out of them', () => {
        expect(renderPreferredModal({ pathname: '/firmware', hash: '#/false' })).toEqual({
            type: 'foreground-app',
            payload: { cancelable: false, variant: '', app: 'firmware' },
        });
    });

    it('ignores an app that is both foreground and fullscreen', () => {
        expect(renderPreferredModal({ pathname: '/start' })).toEqual({ type: 'none' });
        expect(renderPreferredModal({ pathname: '/onboarding', modal: USER_MODAL })).toEqual({
            type: 'redux-modal',
            payload: USER_MODAL,
        });
    });

    it('prefers nothing when the route does not exist', () => {
        expect(renderPreferredModal({ pathname: '/does-not-exist' })).toEqual({ type: 'none' });
    });
});
