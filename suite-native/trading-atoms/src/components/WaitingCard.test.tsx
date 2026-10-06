import { Text } from 'react-native';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { WaitingCard, type WaitingCardProps } from './WaitingCard';

describe('ProviderWaitingCard', () => {
    const renderProviderWaitingCard = async (props: Partial<WaitingCardProps>) =>
        await renderWithBasicProvider(<WaitingCard title="TITLE" subtitle="SUBTITLE" {...props} />);

    it('should render', async () => {
        const { getByText } = await renderProviderWaitingCard({});

        expect(getByText('TITLE')).toBeOnTheScreen();
        expect(getByText('SUBTITLE')).toBeOnTheScreen();
    });

    it('should render with children', async () => {
        const { getByText } = await renderProviderWaitingCard({
            children: <Text>CHILDREN</Text>,
        });

        expect(getByText('TITLE')).toBeOnTheScreen();
        expect(getByText('SUBTITLE')).toBeOnTheScreen();
    });
});
