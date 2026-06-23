import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useNavigationRemoveInterceptorAlert } from '../useNavigationRemoveInterceptorAlert';

const mockShowStayOnScreenAlert = jest.fn();
const mockHideStayOnScreenAlert = jest.fn();

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useNavigationRemoveActionInterceptor: jest.fn(),
}));

jest.mock('../useShowStayOnScreenAlert', () => ({
    useShowStayOnScreenAlert: () => ({
        showStayOnScreenAlert: mockShowStayOnScreenAlert,
        hideStayOnScreenAlert: mockHideStayOnScreenAlert,
    }),
}));

type RenderUseNavigationRemoveInterceptorAlertOptions = Partial<
    Parameters<typeof useNavigationRemoveInterceptorAlert>[0]
>;

const mockedUseNavigationRemoveActionInterceptor = jest.mocked(
    useNavigationRemoveActionInterceptor,
);

const renderUseNavigationRemoveInterceptorAlert = ({
    onRemoveConfirmed = jest.fn(),
    onStayConfirmed,
    shouldPrevent,
    alertOptions,
}: RenderUseNavigationRemoveInterceptorAlertOptions = {}) =>
    renderHookWithBasicProvider(() =>
        useNavigationRemoveInterceptorAlert({
            onRemoveConfirmed,
            onStayConfirmed,
            shouldPrevent,
            alertOptions,
        }),
    );

const getPreventNavigationRemoveProps = () =>
    mockedUseNavigationRemoveActionInterceptor.mock.calls.at(-1)?.[0];

describe('useNavigationRemoveInterceptorAlert', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should show stay on screen alert on prevented remove action', () => {
        const onRemoveConfirmed = jest.fn();
        const onStayConfirmed = jest.fn();
        const alertOptions = {
            title: 'Leave this screen?',
        };

        renderUseNavigationRemoveInterceptorAlert({
            onRemoveConfirmed,
            onStayConfirmed,
            alertOptions,
        });

        getPreventNavigationRemoveProps()?.onInterceptedAction?.({ type: 'GO_BACK' });

        expect(mockShowStayOnScreenAlert).toHaveBeenCalledTimes(1);
        expect(mockShowStayOnScreenAlert).toHaveBeenCalledWith({
            onRemoveConfirmed,
            onStayConfirmed,
            alertOptions,
        });
    });

    it('should hide stay on screen alert on allowed remove action', () => {
        renderUseNavigationRemoveInterceptorAlert();

        getPreventNavigationRemoveProps()?.onAllowedAction?.({ type: 'PUSH' });

        expect(mockHideStayOnScreenAlert).toHaveBeenCalledTimes(1);
    });

    it('should pass shouldPrevent to useNavigationRemoveActionInterceptor', () => {
        renderUseNavigationRemoveInterceptorAlert({ shouldPrevent: false });

        expect(mockedUseNavigationRemoveActionInterceptor).toHaveBeenCalledWith(
            expect.objectContaining({
                isEnabled: false,
            }),
        );
    });
});
