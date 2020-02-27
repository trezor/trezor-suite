import React from 'react';
import { Input, variables, IconProps } from '../../index';
import { storiesOf } from '@storybook/react';
import { text, boolean, select } from '@storybook/addon-knobs';
import { infoOptions } from '../../support/storybook';

storiesOf('Form', module).add(
    'Input',
    () => {
        const value: any = text('Value', 'Input value');
        const state: any = select(
            'State',
            {
                None: null,
                Success: 'success',
                Warning: 'warning',
                Error: 'error',
            },
            null
        );
        const variant: any = select(
            'Variant',
            {
                'Default (large)': null,
                Small: 'small',
            },
            null
        );
        const display: any = select(
            'Display',
            {
                'Default (normal)': null,
                Short: 'short',
                Block: 'block',
            },
            null
        );

        const topLabel: string = text('Top label', '');
        const bottomText: string = text('Bottom text', '');
        const placeholder: string = text('Placeholder', '');
        const isLoading = boolean('Loading', false);
        const disabled = boolean('Disabled', false);
        const monospace = boolean('Monospace', false);
        const align = select(
            'Align',
            {
                Left: null,
                Right: 'right',
            },
            null
        ) as 'right';

        const buttonText: string = text('Button', '');
        const button = {
            text: buttonText,
            icon: undefined,
            onClick: () => {},
        };

        if (buttonText) {
            const iconOptions: any = {
                None: null,
            };
            variables.ICONS.forEach((icon: IconProps['icon']) => {
                iconOptions[icon] = icon;
            });
            const icon = select('Icon', iconOptions, null);
            if (icon) {
                button.icon = icon;
            }
        }

        return (
            <Input
                {...(disabled ? { disabled } : {})}
                {...(state ? { state } : {})}
                {...(variant ? { variant } : {})}
                {...(display ? { display } : {})}
                {...(topLabel ? { topLabel } : {})}
                {...(bottomText ? { bottomText } : {})}
                {...(placeholder ? { placeholder } : {})}
                {...(isLoading ? { isLoading } : {})}
                {...(monospace ? { monospace } : {})}
                {...(buttonText ? { button } : {})}
                {...(align ? { align } : {})}
                value={value}
            />
        );
    },
    {
        info: {
            ...infoOptions,
            text: `
            ~~~js
            import { Input } from '../../index';
            ~~~
            `,
        },
    }
);
