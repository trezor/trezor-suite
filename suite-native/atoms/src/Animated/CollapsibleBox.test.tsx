import { Text } from 'react-native';

import { renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { CollapsibleBox } from './CollapsibleBox';

const renderCollapsibleBox = (isCollapsed: boolean) =>
    renderWithBasicProvider(
        <CollapsibleBox isCollapsed={isCollapsed}>
            <Text>Content</Text>
        </CollapsibleBox>,
    );

describe('CollapsibleBox', () => {
    it('renders its content while expanded', async () => {
        await renderCollapsibleBox(false);

        expect(screen.getByText('Content')).toBeOnTheScreen();
    });

    it('renders nothing when collapsed from the start', async () => {
        await renderCollapsibleBox(true);

        expect(screen.queryByText('Content')).not.toBeOnTheScreen();
    });

    it('removes its content once collapsed and brings it back when expanded', async () => {
        const { rerender } = await renderCollapsibleBox(false);

        await rerender(
            <CollapsibleBox isCollapsed>
                <Text>Content</Text>
            </CollapsibleBox>,
        );
        expect(screen.queryByText('Content')).not.toBeOnTheScreen();

        await rerender(
            <CollapsibleBox isCollapsed={false}>
                <Text>Content</Text>
            </CollapsibleBox>,
        );
        expect(screen.getByText('Content')).toBeOnTheScreen();
    });
});
