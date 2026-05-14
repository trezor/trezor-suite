import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react-native';

import {
    CardStepper as CardStepperComponent,
    type CardStepperProps,
} from '../../CardStepper/CardStepper';

type CardStepperStory = StoryObj<CardStepperProps>;

const meta: Meta<CardStepperProps> = {
    title: 'Atoms/Cards',
    component: CardStepperComponent,
    decorators: [
        Story => (
            <View style={{ width: '100%' }}>
                <Story />
            </View>
        ),
    ],
};

export default meta;

export const CardStepper: CardStepperStory = {
    name: 'CardStepper',
    args: {
        primaryButtonText: 'Continue',
        secondaryButtonText: 'Cancel',
        buttonsActionType: 'primary',

        onFinish: () => {},
        stepToContentMap: {
            1: {
                header: 'Read this',
                description: 'Step 1 description read this properly',
                icon: 'star',
            },
            2: {
                header: 'Then another one',
                description: 'This is step number two ;)',
                icon: 'timer',
            },
            3: {
                header: 'Still reading?',
                description: 'Step 3 description',
                icon: 'stack',
            },
            4: {
                header: 'Final step',
                description: 'Step 4 description',
                icon: 'flag',
            },
        },
    },
    argTypes: {
        primaryButtonText: {
            control: { type: 'text' },
        },
        secondaryButtonText: {
            control: { type: 'text' },
        },
        buttonsActionType: {
            control: { type: 'select' },
            options: ['primary', 'destructive'],
        },
    },
};
