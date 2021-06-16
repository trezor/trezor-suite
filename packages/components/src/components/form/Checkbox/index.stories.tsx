import React from 'react';
import { useArgs } from '@storybook/client-api';

import { Checkbox } from '.';

export default {
    title: 'Form/Checkbox',
    args: { label: 'Checkbox', isChecked: false },
};

export const Basic = ({ ...args }) => {
    const [{ isChecked }, updateArgs] = useArgs();
    const handleIsChecked = () => updateArgs({ isChecked: !isChecked });

    return (
        <Checkbox isChecked={isChecked} onClick={handleIsChecked}>
            {args.label}
        </Checkbox>
    );
};
