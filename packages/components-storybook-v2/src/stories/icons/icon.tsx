import React from 'react';
import { Icon, variables, colors } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { number, select, color } from '@storybook/addon-knobs';
import { infoOptions } from '../../support/info';

storiesOf('Icons', module).add(
    'Icon',
    () => {
        const size = number('Size', 24);
        const iconColor = color('Color', colors.BLACK50);

        const iconOptions: any = {
            None: null,
        };
        variables.ICONS.forEach((icon: string) => {
            iconOptions[icon] = icon;
        });

        const icon = select('Icon', iconOptions, 'ARROW_DOWN');

        return <Icon icon={icon} size={size} color={iconColor} />;
    },
    {
        info: {
            ...infoOptions,
            text: `
            ~~~js
            import { Input } from '@trezor/components-v2';
            ~~~
            `,
        },
    }
);
