import React, { useState } from 'react';
import { Select } from '.';
import { storiesOf } from '@storybook/react';
import { boolean, select } from '@storybook/addon-knobs';

storiesOf('Form', module).add('Select', () => {
    const [value, setValue] = useState(null);

    const isSearchable = boolean('Searchable', false);
    const isClearable = boolean('Clearable', false);
    const isClean = boolean('IsClean', false);
    const isDisabled = boolean('Disabled', false);
    const withDropdownIndicator = boolean('withDropdownIndicator', true);
    const variant: any = select(
        'Variant',
        {
            'Default (large)': null,
            Small: 'small',
        },
        null
    );

    const values: any = {
        None: null,
        Hello: { value: 'hello', label: 'Hello' },
        World: { value: 'world', label: 'World' },
    };

    const options = Object.keys(values)
        .filter((k: string) => values[k])
        .map((k: string) => values[k]);

    return (
        <Select
            isSearchable={isSearchable}
            isClearable={isClearable}
            isClean={isClean}
            isDisabled={isDisabled}
            withDropdownIndicator={withDropdownIndicator}
            variant={variant}
            value={value}
            onChange={setValue}
            options={options}
        />
    );
});
