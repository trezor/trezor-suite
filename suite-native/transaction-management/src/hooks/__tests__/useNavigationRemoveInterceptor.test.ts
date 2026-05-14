import { usePreventNavigationRemove } from '@suite-native/navigation';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useNavigationRemoveInterceptor } from '../useNavigationRemoveInterceptor';

const mockShowStayOnScreenAlert = jest.fn();
const mockHideStayOnScreenAlert = jest.fn();

jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    usePreventNavigationRemove: jest.fn(),
}));

jest.mock('../useShowStayOnScreenAlert', () => ({
    useShowStayOnScreenAlert: () => ({
        showStayOnScreenAlert: mockShowStayOnScreenAlert,
        hideStayOnScreenAlert: mockHideStayOnScreenAlert,
    }),
}));

type RenderUseNavigationRemoveInterceptorOptions = Partial<
    Parameters<typeof useNavigationRemoveInterceptor>[0]
>;

const mockedUsePreventNavigationRemove = jest.mocked(usePreventNavigationRemove);

const renderUseNavigationRemoveInterceptor = ({
    onRemoveConfirmed = jest.fn(),
    onStayConfirmed,
    shouldPrevent,
    alertOptions,
}: RenderUseNavigationRemoveInterceptorOptions = {}) =>
    renderHookWithBasicProvider(() =>
        useNavigationRemoveInterceptor({
            onRemoveConfirmed,
            onStayConfirmed,
            shouldPrevent,
            alertOptions,
        }),
    );

const getPreventNavigationRemoveProps = () => mockedUsePreventNavigationRemove.mock.calls[0][0];

describe('useNavigationRemoveInterceptor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should show stay on screen alert on prevented remove action', () => {
        const onRemoveConfirmed = jest.fn();
        const onStayConfirmed = jest.fn();
        const alertOptions = {
            title: 'Leave this screen?',
        };

        renderUseNavigationRemoveInterceptor({
            onRemoveConfirmed,
            onStayConfirmed,
            alertOptions,
        });

        getPreventNavigationRemoveProps().onPreventedRemove?.({ type: 'GO_BACK' });

        expect(mockShowStayOnScreenAlert).toHaveBeenCalledTimes(1);
        expect(mockShowStayOnScreenAlert).toHaveBeenCalledWith({
            onRemoveConfirmed,
            onStayConfirmed,
            alertOptions,
        });
    });

    it('should hide stay on screen alert on allowed remove action', () => {
        renderUseNavigationRemoveInterceptor();

        getPreventNavigationRemoveProps().onAllowedRemove?.({ type: 'PUSH' });

        expect(mockHideStayOnScreenAlert).toHaveBeenCalledTimes(1);
    });

    it('should pass shouldPrevent to usePreventNavigationRemove', () => {
        renderUseNavigationRemoveInterceptor({ shouldPrevent: false });

        expect(mockedUsePreventNavigationRemove).toHaveBeenCalledWith(
            expect.objectContaining({
                shouldPrevent: false,
            }),
        );
    });
});
