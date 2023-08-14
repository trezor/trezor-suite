import React from 'react';
import { Icon, variables, colors } from '../../../index';
import { storiesOf } from '@storybook/react';
import { number, select, color } from '@storybook/addon-knobs';

storiesOf('Assets/Icons', module).add('Icon', () => {
    const size = number('Size', 24);
    const iconColor = color('Color', colors.TYPE_LIGHT_GREY);

    const iconOptions: any = {
        None: null,
    };
    variables.ICONS.forEach((icon: string) => {
        iconOptions[icon] = icon;
    });

    const icon = select('Icon', iconOptions, 'ARROW_DOWN');

    return <Icon icon={icon} size={size} color={iconColor} />;
});
