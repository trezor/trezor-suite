import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TimelineDetailsCard } from './TimelineDetailsCard';
import {
    type TimelineDetailsCardItem,
    type TimelineDetailsCardRenderItemIconParams,
} from './types';
import { Text } from '../../Text';

describe('TimelineDetailsCard', () => {
    it('preserves icon precedence and numbered fallback', async () => {
        const items: TimelineDetailsCardItem[] = [
            { id: 'explicit', title: 'First', icon: <Text>Explicit icon</Text> },
            { id: 'callback', title: 'Second' },
            { id: 'fallback', title: 'Third' },
        ];
        const renderItemIcon = jest.fn(({ index }: TimelineDetailsCardRenderItemIconParams) =>
            index === 1 ? <Text>Callback icon</Text> : null,
        );
        const { getByText } = await renderWithBasicProvider(
            <TimelineDetailsCard
                headerTitle="Timeline"
                items={items}
                renderItemIcon={renderItemIcon}
            />,
        );

        expect(getByText('Timeline')).toBeTruthy();
        expect(getByText('Explicit icon')).toBeTruthy();
        expect(getByText('Callback icon')).toBeTruthy();
        expect(getByText('3')).toBeTruthy();
        expect(renderItemIcon).toHaveBeenCalledTimes(2);
    });

    it('preserves custom description containers and missing descriptions', async () => {
        const items: TimelineDetailsCardItem[] = [
            {
                id: 'description',
                title: 'With description',
                description: 'Details',
                descriptionContainer: Text,
            },
            { id: 'empty', title: 'Without description' },
        ];
        const { getByText } = await renderWithBasicProvider(
            <TimelineDetailsCard headerTitle="Timeline" items={items} />,
        );

        expect(getByText('Details')).toBeTruthy();
        expect(getByText('Without description')).toBeTruthy();
    });
});
