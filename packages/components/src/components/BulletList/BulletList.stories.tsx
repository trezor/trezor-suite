import React from 'react';

import { Meta, StoryObj } from '@storybook/react';

import { spacings } from '@trezor/theme';

import { BulletList as BulletListComponent, allowedBulletListFrameProps } from './BulletList';
import { getFramePropsStory } from '../../utils/frameProps';
import { bulletSizes } from './types';

const meta: Meta = {
    title: 'BulletList',
} as Meta;
export default meta;

export const BulletList: StoryObj = {
    render: props => (
        <BulletListComponent {...props}>
            <BulletListComponent.Item title="Lorem ipsum" state="done">
                Lorem ipsum odor amet, consectetuer adipiscing elit. Rutrum varius aptent sapien at
                facilisis consectetur aliquam blandit.
            </BulletListComponent.Item>
            <BulletListComponent.Item title="Dolor sit">
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
        gap: spacings.xxl,
        titleGap: spacings.xs,
        bulletGap: spacings.xl,
        isOrdered: true,
        bulletSize: 'large',
        width: 400,
        margin: { vertical: spacings.lg, horizontal: 'auto ' },
    },
    argTypes: {
        isOrdered: {
            control: {
                type: 'boolean',
            },
        },
        gap: {
            options: Object.values(spacings),
            control: {
                type: 'select',
            },
        },
        titleGap: {
            options: Object.values(spacings),
            control: {
                type: 'select',
            },
        },
        bulletGap: {
            options: Object.values(spacings),
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
        ...getFramePropsStory(allowedBulletListFrameProps).argTypes,
    },
};
