import React from 'react';
import { Meta, StoryObj } from '@storybook/react';

import { spacings } from '@trezor/theme';
import { Icon } from '../Icon/Icon';
import {
    List as ListComponent,
    allowedListFrameProps,
    allowedListTextProps,
    bulletVerticalAlignments,
} from './List';
import { getFramePropsStory } from '../../utils/frameProps';
import { getTextPropsStory } from '../typography/utils';

const meta: Meta = {
    title: 'List',
} as Meta;
export default meta;

const iconProps = {
    size: 'extraLarge' as const,
    variant: 'primary' as const,
};

export const List: StoryObj = {
    render: props => (
        <>
            <ListComponent {...props}>
                <ListComponent.Item bulletComponent={<Icon name="butterfly" {...iconProps} />}>
                    Lorem ipsum odor amet, consectetuer adipiscing elit. Vel hac cras ultrices
                    nullam mattis proin. In rhoncus interdum molestie hac commodo bibendum torquent
                    conubia. Congue facilisis sollicitudin gravida mauris suspendisse hendrerit
                    habitasse per.
                </ListComponent.Item>
                <ListComponent.Item bulletComponent={<Icon name="compass" {...iconProps} />}>
                    Diam sociosqu mi nisl duis aliquet faucibus venenatis nullam. Eget augue auctor
                    platea tincidunt vestibulum nisi consequat potenti. Nullam nascetur integer
                    mauris imperdiet et orci iaculis. Mauris elementum vel dui tincidunt tempus
                    mattis lobortis.
                </ListComponent.Item>
                <ListComponent.Item bulletComponent={<Icon name="bell" {...iconProps} />}>
                    Rutrum varius aptent sapien at facilisis consectetur aliquam blandit. Odio
                    ultrices facilisi risus feugiat tincidunt molestie curae. Leo lobortis semper
                    himenaeos cras facilisi ac consectetur. Netus vestibulum praesent feugiat nam
                    potenti cursus. Facilisis porta aptent pulvinar nibh litora pellentesque sodales
                    montes interdum.
                </ListComponent.Item>
            </ListComponent>

            <ListComponent {...props}>
                <ListComponent.Item>
                    Lorem ipsum odor amet, consectetuer adipiscing elit.
                </ListComponent.Item>
                <ListComponent.Item>
                    Diam sociosqu mi nisl duis aliquet faucibus venenatis nullam.
                </ListComponent.Item>
                <ListComponent.Item>
                    Rutrum varius aptent sapien at facilisis consectetur aliquam blandit.
                </ListComponent.Item>
            </ListComponent>
        </>
    ),
    args: {
        gap: spacings.xl,
        isOrdered: false,
        bulletGap: spacings.xl,
        bulletAlignment: 'center',
        bulletComponent: null,
        ...getFramePropsStory(allowedListFrameProps).args,
        ...getTextPropsStory(allowedListTextProps).args,
        width: '75%',
        margin: { top: spacings.xl, bottom: spacings.xl, left: 'auto', right: 'auto' },
    },
    argTypes: {
        gap: {
            options: Object.values(spacings),
            control: {
                type: 'select',
            },
        },
        isOrdered: {
            control: {
                type: 'boolean',
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
        ...getFramePropsStory(allowedListFrameProps).argTypes,
        ...getTextPropsStory(allowedListTextProps).argTypes,
    },
};
