import React from 'react';

import { type Meta, type StoryObj } from '@storybook/react';

import { spacingsNew } from '@trezor/theme';

import { BulletList as BulletListComponent, allowedBulletListFrameProps } from './BulletList';
import { bulletLineWidths, bulletListDirections, bulletSizes } from './types';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof BulletListComponent> = {
    title: 'BulletList',
};
export default meta;

export const BulletList: StoryObj<typeof BulletListComponent> = {
    render: props => (
        <BulletListComponent {...props}>
            <BulletListComponent.Item title="Lorem ipsum" state="done">
                Lorem ipsum odor amet, consectetuer adipiscing elit. Rutrum varius aptent sapien at
                facilisis consectetur aliquam blandit.
            </BulletListComponent.Item>
            <BulletListComponent.Item title="Dolor sit" state="active">
                Diam sociosqu mi nisl duis aliquet faucibus venenatis nullam. Leo lobortis semper
                himenaeos cras facilisi ac consectetur. Netus vestibulum praesent feugiat nam
                potenti cursus.
            </BulletListComponent.Item>
            <BulletListComponent.Item title="Facilisis consectetur" state="pending" />
            <BulletListComponent.Item title="Lobortis semper" state="pending">
                Leo lobortis semper himenaeos cras facilisi ac consectetur. Netus vestibulum
                praesent feugiat nam potenti cursus.
            </BulletListComponent.Item>
        </BulletListComponent>
    ),
    args: {
        ...getFramePropsStory(allowedBulletListFrameProps).args,
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
            options: spacingsNew,
            control: {
                type: 'select',
            },
        },
        titleGap: {
            options: spacingsNew,
            control: {
                type: 'select',
            },
        },
        bulletGap: {
            options: spacingsNew,
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
            options: bulletLineWidths,
            control: {
                type: 'select',
            },
        },
        direction: {
            options: bulletListDirections,
            control: {
                type: 'select',
            },
        },
        ...getFramePropsStory(allowedBulletListFrameProps).argTypes,
    },
};
