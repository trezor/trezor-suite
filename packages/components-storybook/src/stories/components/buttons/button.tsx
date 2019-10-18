import React from 'react';
import { Button, variables } from '@trezor/components';
import { storiesOf } from '@storybook/react';
import { text, boolean, select } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/info';

const { ICONS } = variables;

storiesOf('Buttons', module).add(
    'Button',
    () => {
        const isDisabled = boolean('Disabled', false);
        const isLoading = boolean('Loading', false);
        const buttonText = text('Text', 'Button Text');
        const variant: any = select(
            'Variant',
            {
                Default: null,
                info: 'info',
                warning: 'warning',
                error: 'error',
                white: 'white',
            },
            null
        );
        const iconOptions: any = {
            None: null,
        };

        ICONS.forEach((icon: string) => {
            iconOptions[icon] = icon;
        });

        const icon = select('Icon', iconOptions, null);
        const isTransparent = boolean('Transparent', false);
        const fullWidth = boolean('FullWidth', false);

        let align;
        if (fullWidth) {
            align = select(
                'align',
                {
                    Center: null,
                    Left: 'left',
                    Right: 'right',
                },
                null
            );
        }

        return (
            <Button
                {...(isDisabled ? { isDisabled } : {})}
                {...(variant ? { variant } : {})}
                {...(isTransparent ? { isTransparent } : {})}
                {...(icon ? { icon } : {})}
                {...(isLoading ? { isLoading } : {})}
                {...(fullWidth ? { fullWidth } : {})}
                {...(fullWidth && align ? { align } : {})}
            >
                {buttonText}
            </Button>
        );
    },
    {
        info: {
            ...infoOptions,
            text: `
            ~~~js
            import { Button } from 'trezor-ui-components';
            ~~~
            `,
        },
    }
);
