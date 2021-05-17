import React from 'react';
import { Button } from './index';
import { variables } from '../../../config';
import { storiesOf } from '@storybook/react';
import { boolean, select, text } from '@storybook/addon-knobs';

storiesOf('Buttons', module).add('Button', () => {
    const value = text('Value', 'Button');
    const variant: any = select(
        'Variant',
        {
            'Default (primary)': null,
            Secondary: 'secondary',
            Tertiary: 'tertiary',
            Danger: 'danger',
        },
        null
    );
    const size: any = select(
        'Size',
        {
            'Default (large)': null,
            Small: 'small',
        },
        null
    );

    const iconOptions: any = {
        None: null,
    };
    variables.ICONS.forEach((icon: string) => {
        iconOptions[icon] = icon;
    });
    const icon = select('Icon', iconOptions, null);
    const alignIcon: any = icon
        ? select(
              'Align icon',
              {
                  'Default (left)': 'left',
                  Right: 'right',
              },
              'left'
          )
        : null;

    const fullWidth = boolean('Full width', false);
    const isDisabled = boolean('Disabled', false);
    const isLoading = boolean('Loading', false);

    return (
        <Button
            {...(isDisabled ? { isDisabled } : {})}
            {...(isLoading ? { isLoading } : {})}
            {...(variant ? { variant } : {})}
            {...(size ? { size } : {})}
            {...(icon ? { icon } : {})}
            {...(icon && alignIcon !== 'left' ? { alignIcon } : {})}
            {...(fullWidth ? { fullWidth } : {})}
        >
            {value}
        </Button>
    );
});
