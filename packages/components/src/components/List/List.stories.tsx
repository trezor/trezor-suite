import React, { type SVGProps } from 'react';

import { type Meta, type StoryObj } from '@storybook/react';

import { spacings } from '@trezor/theme';

import { List as ListComponent, allowedListFrameProps, allowedListTextProps } from './List';
import { bulletVerticalAlignments, listIntents } from './types';
import { getFramePropsStory } from '../../utils/frameProps';
import { Icon } from '../Icon/Icon';
import { getTextPropsStory } from '../typography/utils';

const TestIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M12 3L21 20H3L12 3Z" />
    </svg>
);

const meta: Meta<typeof ListComponent> = {
    title: 'List',
};
export default meta;

const iconProps = {
    size: 32,
    intent: 'brand',
} as const;

export const List: StoryObj<typeof ListComponent> = {
    render: props => (
        <ListComponent {...props}>
            <ListComponent.Item bulletComponent={<Icon as={TestIcon} {...iconProps} />}>
                Lorem ipsum odor amet, consectetuer adipiscing elit. Vel hac cras ultrices nullam
                mattis proin. In rhoncus interdum molestie hac commodo bibendum torquent conubia.
                Congue facilisis sollicitudin gravida mauris suspendisse hendrerit habitasse per.
            </ListComponent.Item>
            <ListComponent.Item bulletComponent={<Icon as={TestIcon} {...iconProps} />}>
                Diam sociosqu mi nisl duis aliquet faucibus venenatis nullam. Eget augue auctor
                platea tincidunt vestibulum nisi consequat potenti. Nullam nascetur integer mauris
                imperdiet et orci iaculis. Mauris elementum vel dui tincidunt tempus mattis
                lobortis.
            </ListComponent.Item>
            <ListComponent.Item bulletComponent={<Icon as={TestIcon} {...iconProps} />}>
                Rutrum varius aptent sapien at facilisis consectetur aliquam blandit. Odio ultrices
                facilisi risus feugiat tincidunt molestie curae. Leo lobortis semper himenaeos cras
                facilisi ac consectetur. Netus vestibulum praesent feugiat nam potenti cursus.
                Facilisis porta aptent pulvinar nibh litora pellentesque sodales montes interdum.
            </ListComponent.Item>
        </ListComponent>
    ),
    args: {
        gap: spacings.xl,
        bulletGap: spacings.xl,
        bulletAlignment: 'center',
        bulletComponent: null,
        ...getFramePropsStory(allowedListFrameProps).args,
        ...getTextPropsStory(allowedListTextProps).args,
        width: '70%',
        margin: { vertical: spacings.lg, horizontal: 'auto' },
    },
    argTypes: {
        gap: {
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
        bulletAlignment: {
            options: Object.values(bulletVerticalAlignments),
            control: {
                type: 'select',
            },
        },
        intent: {
            options: listIntents,
            control: {
                type: 'select',
            },
        },
        ...getFramePropsStory(allowedListFrameProps).argTypes,
        ...getTextPropsStory(allowedListTextProps).argTypes,
    },
};
