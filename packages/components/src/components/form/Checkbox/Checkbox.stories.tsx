import React from 'react';
import { useArgs } from '@storybook/client-api';

import { Checkbox as CheckboxComponent } from './Checkbox';

export default {
    title: 'Form/Checkbox',
    args: { label: 'Checkbox', isChecked: false, isDisabled: false },
};

export const Checkbox = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ isChecked }, updateArgs] = useArgs();
        const handleIsChecked = () => updateArgs({ isChecked: !isChecked });

        return (
            <CheckboxComponent
                isChecked={isChecked}
                isDisabled={args.isDisabled}
                onClick={handleIsChecked}
            >
                {args.label}
            </CheckboxComponent>
        );
    },
};
