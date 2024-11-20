import { Meta, StoryObj } from '@storybook/react';

import {
    InfoPair as InfoPairComponent,
    allowedInfoPairFrameProps,
    allowedInfoPairTextProps,
    InfoPairProps,
} from './InfoPair';
import { getFramePropsStory } from '../../utils/frameProps';
import { getTextPropsStory } from '../typography/utils';
import { textVariants } from '../typography/Text/Text';

const meta: Meta = {
    title: 'InfoPair',
    component: InfoPairComponent,
} as Meta;
export default meta;

export const InfoPair: StoryObj<InfoPairProps> = {
    args: {
        leftContent: 'Left',
        rightContent: 'Right',
        ...getFramePropsStory(allowedInfoPairFrameProps).args,
        ...getTextPropsStory(allowedInfoPairTextProps).args,
    },
    argTypes: {
        variant: {
            control: {
                type: 'select',
            },
            options: textVariants,
        },
        ...getFramePropsStory(allowedInfoPairFrameProps).argTypes,
        ...getTextPropsStory(allowedInfoPairTextProps).argTypes,
    },
};
