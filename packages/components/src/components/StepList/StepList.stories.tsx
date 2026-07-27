import React from 'react';

import { type Meta, type StoryObj } from '@storybook/react';

import { spacingValues } from '@trezor/theme';

import { StepList as StepListComponent, allowedStepListFrameProps } from './StepList';
import { bulletSizes, stepLineWidths, stepListDirections } from './types';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof StepListComponent> = {
    title: 'StepList',
};
export default meta;

export const StepList: StoryObj<typeof StepListComponent> = {
    render: props => (
        <StepListComponent {...props}>
            <StepListComponent.Item title="Lorem ipsum" state="done">
                Lorem ipsum odor amet, consectetuer adipiscing elit. Rutrum varius aptent sapien at
                facilisis consectetur aliquam blandit.
            </StepListComponent.Item>
            <StepListComponent.Item title="Dolor sit" state="active">
                Diam sociosqu mi nisl duis aliquet faucibus venenatis nullam. Leo lobortis semper
                himenaeos cras facilisi ac consectetur. Netus vestibulum praesent feugiat nam
                potenti cursus.
            </StepListComponent.Item>
            <StepListComponent.Item title="Facilisis consectetur" state="pending" />
            <StepListComponent.Item title="Lobortis semper" state="pending">
                Leo lobortis semper himenaeos cras facilisi ac consectetur. Netus vestibulum
                praesent feugiat nam potenti cursus.
            </StepListComponent.Item>
        </StepListComponent>
    ),
    args: {
        ...getFramePropsStory(allowedStepListFrameProps).args,
        gap: 32,
        titleGap: 8,
        bulletGap: 24,
        isOrdered: true,
        bulletSize: 'large',
        lineWidth: 2,
        direction: 'vertical',
        width: 600,
        margin: { vertical: 12, horizontal: 'auto' },
    },
    argTypes: {
        isOrdered: {
            control: {
                type: 'boolean',
            },
        },
        gap: {
            options: spacingValues,
            control: {
                type: 'select',
            },
        },
        titleGap: {
            options: spacingValues,
            control: {
                type: 'select',
            },
        },
        bulletGap: {
            options: spacingValues,
            control: {
                type: 'select',
            },
        },
        bulletSize: {
            options: bulletSizes,
            control: {
                type: 'select',
            },
        },
        lineWidth: {
            options: stepLineWidths,
            control: {
                type: 'select',
            },
        },
        direction: {
            options: stepListDirections,
            control: {
                type: 'select',
            },
        },
        ...getFramePropsStory(allowedStepListFrameProps).argTypes,
    },
};
