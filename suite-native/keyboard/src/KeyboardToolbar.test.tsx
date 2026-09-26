import { Text } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';

import { mock } from '@suite-common/dependency-injection';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { KeyboardToolbar } from './KeyboardToolbar';
import { KeyboardToolbarPortal } from './KeyboardToolbarPortal';

describe('KeyboardToolbar', () => {
    beforeEach(() => {
        jest.mocked(useKeyboardState).mockReturnValue(true);
    });

    it('keeps content mounted but inaccessible when the keyboard closes', async () => {
        const renderToolbar = () => (
            <KeyboardToolbar onHeightChange={mock()}>
                <Text>Toolbar action</Text>
            </KeyboardToolbar>
        );
        const { getByTestId, queryByText, rerender } =
            await renderWithBasicProvider(renderToolbar());
        const toolbar = getByTestId('@keyboard/toolbar', { includeHiddenElements: true });
        await fireEvent(toolbar, 'layout', {
            nativeEvent: { layout: { height: 64, width: 320, x: 0, y: 0 } },
        });
        expect(queryByText('Toolbar action')).not.toBeNull();

        jest.mocked(useKeyboardState).mockReturnValue(false);
        await rerender(renderToolbar());

        expect(toolbar.props.pointerEvents).toBe('none');
        expect(queryByText('Toolbar action')).toBeNull();
        expect(queryByText('Toolbar action', { includeHiddenElements: true })).not.toBeNull();

        jest.mocked(useKeyboardState).mockReturnValue(true);
        await rerender(renderToolbar());

        expect(toolbar.props.pointerEvents).toBe('auto');
        expect(queryByText('Toolbar action')).not.toBeNull();
    });

    it('keeps a teleported toolbar mounted while its visibility changes with the keyboard open', async () => {
        const renderToolbar = (isVisible: boolean) => (
            <KeyboardToolbarPortal hostName="test-toolbar" isVisible={isVisible}>
                <Text>Toolbar action</Text>
            </KeyboardToolbarPortal>
        );
        const { getByTestId, queryByText, rerender } = await renderWithBasicProvider(
            renderToolbar(false),
        );
        const toolbar = getByTestId('@keyboard/toolbar', { includeHiddenElements: true });
        await fireEvent(toolbar, 'layout', {
            nativeEvent: { layout: { height: 64, width: 320, x: 0, y: 0 } },
        });

        expect(toolbar.props.pointerEvents).toBe('none');
        expect(queryByText('Toolbar action')).toBeNull();
        expect(queryByText('Toolbar action', { includeHiddenElements: true })).not.toBeNull();

        await rerender(renderToolbar(true));

        expect(toolbar.props.pointerEvents).toBe('auto');
        expect(queryByText('Toolbar action')).not.toBeNull();

        await rerender(renderToolbar(false));

        expect(toolbar.props.pointerEvents).toBe('none');
        expect(queryByText('Toolbar action')).toBeNull();
        expect(queryByText('Toolbar action', { includeHiddenElements: true })).not.toBeNull();
    });
});
