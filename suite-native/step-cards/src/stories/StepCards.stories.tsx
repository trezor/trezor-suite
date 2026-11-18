import { type ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/react-native';

import { HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';

import { CurrentStepCard } from '../components/CurrentStepCard/CurrentStepCard';
import { CurrentStepCardDivider } from '../components/CurrentStepCard/CurrentStepCardDivider';
import { CurrentStepCardHeader } from '../components/CurrentStepCard/CurrentStepCardHeader';
import { FinishedStepCard } from '../components/FinishedStepCard';
import { NextStepCard } from '../components/NextStepCard';

type StepCardsStory = StoryObj;

const meta: Meta = {
    title: 'StepCards',
    decorators: [Story => <Story />],
};

export default meta;

type DetailRowProps = {
    label: ReactNode;
    value: ReactNode;
};

const DetailRow = ({ label, value }: DetailRowProps) => (
    <HStack
        spacing="sp8"
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="sp16"
        paddingVertical="sp12"
    >
        <Text variant="body-md" color="contentSecondary">
            {label}
        </Text>
        <Text variant="body-md">{value}</Text>
    </HStack>
);

export const StepCards: StepCardsStory = {
    name: 'StepCards',
    render: () => (
        <VStack spacing={0}>
            <FinishedStepCard title="Revoke" />
            <CurrentStepCard stepNumber={2} stepCount={3}>
                <CurrentStepCardHeader>
                    <Text variant="headline-sm">Approve spending</Text>
                    <Text variant="body-sm" color="contentSecondary">
                        Let the provider use your UNI to process your swap.
                    </Text>
                </CurrentStepCardHeader>
                <DetailRow label="Limit" value="300 USDT" />
                <CurrentStepCardDivider />
                <DetailRow label="Network fee" value="≈ $0.01" />
            </CurrentStepCard>
            <NextStepCard stepNumber={3} stepCount={3} title="Swap">
                <HStack spacing="sp4" alignItems="center">
                    <Icon name="lock" size="medium" color="contentSecondary" />
                    <Text variant="body-md" color="contentSecondary">
                        Approval required
                    </Text>
                </HStack>
            </NextStepCard>
        </VStack>
    ),
};
