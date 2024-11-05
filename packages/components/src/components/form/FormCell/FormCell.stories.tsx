import React from 'react';

import { Meta, StoryObj } from '@storybook/react';

import { FormCell as FormCellComponent, allowedFormCellFrameProps } from './FormCell';
import { SkeletonRectangle } from '../../skeletons/SkeletonRectangle';
import { variables } from '../../../config';
import { getFramePropsStory } from '../../../utils/frameProps';

const meta: Meta = {
    title: 'Form',
} as Meta;
export default meta;

export const FormCell: StoryObj = {
    render: props => (
        <FormCellComponent {...props}>
            <SkeletonRectangle width="100%" height={40} />
        </FormCellComponent>
    ),
    args: {
        inputState: 'error',
        labelLeft: 'Label left',
        labelRight: 'Label right',
        labelHoverRight: 'Label hover right',
        bottomText: 'Bottom text',
        bottomTextIconName: 'info',
        ...getFramePropsStory(allowedFormCellFrameProps).args,
    },
    argTypes: {
        bottomText: { control: 'text' },
        labelHoverRight: { control: 'text' },
        labelLeft: { control: 'text' },
        labelRight: { control: 'text' },
        inputState: { control: 'select', options: ['error', 'warning', 'primary'] },
        bottomTextIconName: {
            options: ['none', ...variables.ICONS],
            mapping: {
                ...variables.ICONS,
                none: undefined,
            },
            control: {
                type: 'select',
            },
        },
        ...getFramePropsStory(allowedFormCellFrameProps).argTypes,
    },
};
