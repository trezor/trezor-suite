import { type Meta, type StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { Button, Column, Icon, Row, Text } from '@trezor/components';
import { LockIcon } from '@trezor/icons';

import { FlowStep as FlowStepComponent, type FlowStepState } from './FlowStep';
import { FlowStepList as FlowStepListComponent } from './FlowStepList';

const meta: Meta = {
    title: 'FlowStep',
};

export default meta;

type StoryArgs = {
    label: string;
    title: string;
    description: string;
    state: FlowStepState;
};

const StepBody = () => (
    <Column gap={12}>
        <Row justifyContent="space-between">
            <Text typographyStyle="body-sm">Limit</Text>
            <Text typographyStyle="body-sm-strong">0.0109 UNI</Text>
        </Row>
        <Row justifyContent="space-between">
            <Text typographyStyle="body-sm">Network fee</Text>
            <Text typographyStyle="body-sm-strong">≈ $0.01</Text>
        </Row>
        <Button width="100%" onClick={action('onContinue')}>
            Continue
        </Button>
    </Column>
);

export const FlowStep: StoryObj<StoryArgs> = {
    args: {
        label: 'Step 1 of 2',
        title: 'Approve spending',
        description: 'Let the provider access your UNI to process your swap.',
        state: 'active',
    },
    argTypes: {
        state: { control: 'select', options: ['active', 'done', 'upcoming'] },
    },
    render: args => (
        <FlowStepComponent
            {...args}
            addon={
                <Row gap={4}>
                    <Icon as={LockIcon} size={16} intent="neutral" priority="secondary" />
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        Approval required
                    </Text>
                </Row>
            }
        >
            <StepBody />
        </FlowStepComponent>
    ),
};

export const FlowStepList: StoryObj = {
    render: () => (
        <FlowStepListComponent>
            <FlowStepComponent label="Step 1 of 3" title="Revoke" state="done" />
            <FlowStepComponent
                label="Step 2 of 3"
                title="Approve spending"
                description="Let the provider access your USDT to process your swap."
                state="active"
            >
                <StepBody />
            </FlowStepComponent>
            <FlowStepComponent
                label="Step 3 of 3"
                title="Swap"
                state="upcoming"
                addon={
                    <Row gap={4}>
                        <Icon as={LockIcon} size={16} intent="neutral" priority="secondary" />
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            Approval required
                        </Text>
                    </Row>
                }
            />
        </FlowStepListComponent>
    ),
};
