import React from 'react';
import { useArgs } from '@storybook/client-api';

import { Checkbox } from './Checkbox';

export default {
    title: 'Form/Checkbox',
    args: { label: 'Checkbox', isChecked: false, isDisabled: false },
};

export const Basic = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ isChecked }, updateArgs] = useArgs();
        const handleIsChecked = () => updateArgs({ isChecked: !isChecked });

        return (
            <Checkbox isChecked={isChecked} isDisabled={args.isDisabled} onClick={handleIsChecked}>
                {args.label}
            </Checkbox>
        );
    },
};
