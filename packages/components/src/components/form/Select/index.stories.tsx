import React from 'react';
import { Select } from '.';
import { storiesOf } from '@storybook/react';
import { text, boolean, select } from '@storybook/addon-knobs';

storiesOf('Form', module).add('Select', () => {
    const isSearchable = boolean('Searchable', false);
    const isClearable = boolean('Clearable', false);
    const isClean = boolean('IsClean', false);
    const isDisabled = boolean('Disabled', false);
    const withDropdownIndicator = boolean('withDropdownIndicator', true);
    const topLabel = text('Top label', 'Input label');
    const values: any = {
        None: null,
        Hello: { value: 'hello', label: 'Hello' },
        World: { value: 'world', label: 'World' },
    };

    const options = Object.keys(values)
        .filter((k: string) => values[k])
        .map((k: string) => values[k]);

    const display: any = select(
        'Display',
        {
            'Default (normal)': null,
            Short: 'short',
            Block: 'block',
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

    return (
        <Select
            {...(!isSearchable ? { isSearchable } : {})}
            {...(isClearable ? { isClearable } : {})}
            {...(isClean ? { isClean } : {})}
            {...(isDisabled ? { isDisabled } : {})}
            {...(withDropdownIndicator ? {} : { withDropdownIndicator })}
            {...(display ? { display } : {})}
            {...(variant ? { variant } : {})}
            value={select('Value', values, null)}
            options={options}
            topLabel={topLabel}
        />
    );
});
