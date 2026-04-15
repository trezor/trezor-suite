import type { Meta, StoryObj } from '@storybook/react-native';
import { action } from 'storybook/actions';

import { Box, Button } from '@suite-native/atoms';

import { type Alert } from '../alertsAtoms';
import { AlertRenderer } from '../components/AlertRenderer';
import { useAlert } from '../useAlert';

type AlertSheetArgs = {
    title: string;
    description: string;
    pictogramVariant: Alert['pictogramVariant'];
    primaryButtonTitle: string;
    primaryButtonIntent: NonNullable<Alert['primaryButtonColorProps']>['intent'];
    primaryButtonPriority: NonNullable<Alert['primaryButtonColorProps']>['priority'];
    secondaryButtonTitle: string;
    secondaryButtonIntent: NonNullable<Alert['secondaryButtonColorProps']>['intent'];
    secondaryButtonPriority: NonNullable<Alert['secondaryButtonColorProps']>['priority'];
};

type AlertSheetStory = StoryObj<AlertSheetArgs>;

const meta: Meta<AlertSheetArgs> = {
    title: 'Alerts',
    render: ({
        title,
        description,
        pictogramVariant,
        primaryButtonTitle,
        primaryButtonIntent,
        primaryButtonPriority,
        secondaryButtonTitle,
        secondaryButtonIntent,
        secondaryButtonPriority,
    }) => {
        const { showAlert } = useAlert();

        const handleShowAlert = () => {
            showAlert({
                title,
                description,
                pictogramVariant,
                primaryButtonTitle,
                secondaryButtonTitle,
                primaryButtonColorProps: {
                    intent: primaryButtonIntent,
                    priority: primaryButtonPriority,
                },
                onPressPrimaryButton: action('onPressPrimaryButton'),
                secondaryButtonColorProps: {
                    intent: secondaryButtonIntent,
                    priority: secondaryButtonPriority,
                },
                onPressSecondaryButton: action('onPressSecondaryButton'),
            });
        };

        return (
            <Box>
                <Button onPress={handleShowAlert}>Show Alert</Button>
                <AlertRenderer />
            </Box>
        );
    },
};

export default meta;

export const AlertSheet: AlertSheetStory = {
    name: 'AlertSheet',
    args: {
        title: 'Alert title',
        description:
            'This is the alert description. Alert has to be closed and opened again to see the changed properties.',
        pictogramVariant: 'warning',
        primaryButtonTitle: 'Confirm',
        primaryButtonIntent: 'brand',
        primaryButtonPriority: 'primary',
        secondaryButtonTitle: '',
        secondaryButtonIntent: 'neutral',
        secondaryButtonPriority: 'secondary',
    },
    argTypes: {
        title: {
            control: { type: 'text' },
        },
        description: {
            control: { type: 'text' },
        },
        pictogramVariant: {
            control: { type: 'select' },
            options: ['success', 'info', 'warning', 'critical'],
        },
        primaryButtonTitle: {
            control: { type: 'text' },
        },
        primaryButtonIntent: {
            control: { type: 'select' },
            options: ['brand', 'neutral', 'info', 'warning', 'critical', 'accentViolet'],
        },
        primaryButtonPriority: {
            control: { type: 'select' },
            options: ['primary', 'secondary'],
        },
        secondaryButtonTitle: {
            control: { type: 'text' },
        },
        secondaryButtonIntent: {
            control: { type: 'select' },
            options: ['brand', 'neutral', 'info', 'warning', 'critical', 'accentViolet'],
        },
        secondaryButtonPriority: {
            control: { type: 'select' },
            options: ['primary', 'secondary'],
        },
    },
};
