import { Text } from 'react-native';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { TradeStatusStepper, type TradeStatusStepperProps } from './TradeStatusStepper';

describe('TradeStatusStepper', () => {
    const renderStepper = (props: Partial<TradeStatusStepperProps> = {}) =>
        renderWithBasicProvider(
            <TradeStatusStepper
                steps={[
                    {
                        id: 'send',
                        state: 'active',
                        title: {
                            pending: 'Transaction pending',
                            processing: 'Sending transaction',
                            completed: 'Transaction sent',
                        },
                        subItems: {
                            pending: [<Text key="pending">Pending details</Text>],
                            processing: [<Text key="processing">Transaction ID</Text>],
                            completed: [<Text key="completed">Completed details</Text>],
                        },
                    },
                    {
                        id: 'provider',
                        state: 'pending',
                        title: { pending: 'Provider will process transaction' },
                    },
                ]}
                {...props}
            />,
        );

    it('should render active and pending step content', () => {
        const { getByTestId, getByText, queryByText } = renderStepper();

        expect(getByTestId('@trade-status-stepper/send/active')).toBeOnTheScreen();
        expect(getByTestId('@trade-status-stepper/provider/pending')).toBeOnTheScreen();
        expect(getByText('Sending transaction')).toBeOnTheScreen();
        expect(getByText('Transaction ID')).toBeOnTheScreen();
        expect(queryByText('Transaction pending')).toBeNull();
        expect(queryByText('Pending details')).toBeNull();
    });

    it('should render the completed content for a completed step', () => {
        const { getByTestId, getByText, queryByText } = renderStepper({
            steps: [
                {
                    id: 'send',
                    state: 'completed',
                    title: {
                        pending: 'Transaction pending',
                        processing: 'Sending transaction',
                        completed: 'Transaction sent',
                    },
                    subItems: {
                        pending: [<Text key="pending">Pending details</Text>],
                        processing: [<Text key="processing">Transaction ID</Text>],
                        completed: [<Text key="completed">Completed details</Text>],
                    },
                },
            ],
        });

        expect(getByTestId('@trade-status-stepper/send/completed')).toBeOnTheScreen();
        expect(getByText('Transaction sent')).toBeOnTheScreen();
        expect(getByText('Completed details')).toBeOnTheScreen();
        expect(queryByText('Sending transaction')).toBeNull();
        expect(queryByText('Transaction ID')).toBeNull();
    });

    it('should fall back to pending content when a state variant is missing', () => {
        const { getByText } = renderStepper({
            steps: [
                {
                    id: 'provider',
                    state: 'completed',
                    title: { pending: 'Provider transaction' },
                    subItems: {
                        pending: [<Text key="provider">Provider details</Text>],
                    },
                },
            ],
        });

        expect(getByText('Provider transaction')).toBeOnTheScreen();
        expect(getByText('Provider details')).toBeOnTheScreen();
    });
});
