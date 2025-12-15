import { Text } from 'react-native';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { WaitingCard, type WaitingCardProps } from '../WaitingCard';

describe('ProviderWaitingCard', () => {
    const renderProviderWaitingCard = (props: Partial<WaitingCardProps>) =>
        renderWithBasicProvider(<WaitingCard title="TITLE" subtitle="SUBTITLE" {...props} />);

    it('should render', () => {
        const { getByText } = renderProviderWaitingCard({});

        expect(getByText('TITLE')).toBeOnTheScreen();
        expect(getByText('SUBTITLE')).toBeOnTheScreen();
    });

    it('should render with children', () => {
        const { getByText } = renderProviderWaitingCard({
            children: <Text>CHILDREN</Text>,
        });

        expect(getByText('TITLE')).toBeOnTheScreen();
        expect(getByText('SUBTITLE')).toBeOnTheScreen();
    });
});
