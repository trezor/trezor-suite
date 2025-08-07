/**
 * THIS SHOULD ONLY BE IMPORTED IN STORIES TO AVOID EXCESSIVE BUNDLE SIZE
 */

import { IconProps as BaseIconProps, Icon as IconBase } from './IconBase';
import { IconName } from '../Icon/types';
import { iconNames } from './constants';

const srcDict = Object.keys(iconNames).reduce(
    (acc, iconKey) => {
        // @ts-expect-error todo
        acc[iconKey] = require(`@trezor/suite-icons/src/assets/icons/${iconKey}.svg`);

        return acc;
    },
    {} as Record<IconName, string>,
);

type IconProps = Omit<BaseIconProps, 'src'> & {
    name: keyof typeof srcDict;
};

export const IconStories = (props: IconProps) => (
    <IconBase {...props} src={srcDict[props.name]} color={undefined} />
);
