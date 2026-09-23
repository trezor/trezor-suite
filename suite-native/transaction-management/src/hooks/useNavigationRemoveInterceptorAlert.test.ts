import { useNavigationRemoveGuard, useOnNavigationRemove } from '@suite-native/navigation';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useNavigationRemoveInterceptorAlert } from './useNavigationRemoveInterceptorAlert';

const mockShowStayOnScreenAlert = jest.fn();
const mockHideStayOnScreenAlert = jest.fn();

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useNavigationRemoveGuard: jest.fn(),
    useOnNavigationRemove: jest.fn(),
}));

jest.mock('./useShowStayOnScreenAlert', () => ({
    useShowStayOnScreenAlert: () => ({
        showStayOnScreenAlert: mockShowStayOnScreenAlert,
        hideStayOnScreenAlert: mockHideStayOnScreenAlert,
    }),
}));

type RenderUseNavigationRemoveInterceptorAlertOptions = Partial<
    Parameters<typeof useNavigationRemoveInterceptorAlert>[0]
>;

const mockedUseNavigationRemoveGuard = jest.mocked(useNavigationRemoveGuard);

const renderUseNavigationRemoveInterceptorAlert = async ({
    onRemoveConfirmed = jest.fn(),
    onStayConfirmed,
    shouldPrevent,
    alertOptions,
}: RenderUseNavigationRemoveInterceptorAlertOptions = {}) =>
    await renderHookWithBasicProvider(() =>
        useNavigationRemoveInterceptorAlert({
            onRemoveConfirmed,
            onStayConfirmed,
            shouldPrevent,
            alertOptions,
        }),
    );

const getGuardProps = () => mockedUseNavigationRemoveGuard.mock.calls.at(-1)?.[0];

describe('useNavigationRemoveInterceptorAlert', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should show stay on screen alert on prevented remove action', async () => {
        const onRemoveConfirmed = jest.fn();
        const onStayConfirmed = jest.fn();
        const alertOptions = {
            title: 'Leave this screen?',
        };

        await renderUseNavigationRemoveInterceptorAlert({
            onRemoveConfirmed,
            onStayConfirmed,
            alertOptions,
        });

        getGuardProps()?.onBlocked?.({
            action: { type: 'GO_BACK' },
            continueNavigation: jest.fn(),
        });

        expect(mockShowStayOnScreenAlert).toHaveBeenCalledTimes(1);
        expect(mockShowStayOnScreenAlert).toHaveBeenCalledWith({
            onRemoveConfirmed,
            onStayConfirmed,
            alertOptions,
        });
    });

    it('should hide stay on screen alert on allowed remove action', async () => {
        await renderUseNavigationRemoveInterceptorAlert();

        jest.mocked(useOnNavigationRemove)
            .mock.calls.at(-1)?.[0]
            .onRemoveAttempt({ type: 'REPLACE' });

        expect(mockHideStayOnScreenAlert).toHaveBeenCalledTimes(1);
    });

    it('should keep the alert visible on back attempts', async () => {
        await renderUseNavigationRemoveInterceptorAlert();

        for (const type of ['GO_BACK', 'POP']) {
            jest.mocked(useOnNavigationRemove).mock.calls.at(-1)?.[0].onRemoveAttempt({ type });
        }

        expect(mockHideStayOnScreenAlert).not.toHaveBeenCalled();
    });

    it('should pass shouldPrevent to useNavigationRemoveGuard', async () => {
        await renderUseNavigationRemoveInterceptorAlert({ shouldPrevent: false });

        expect(jest.mocked(useOnNavigationRemove)).toHaveBeenCalledWith(
            expect.objectContaining({ isEnabled: false }),
        );
        expect(mockedUseNavigationRemoveGuard).toHaveBeenCalledWith(
            expect.objectContaining({
                isEnabled: false,
            }),
        );
    });
});
