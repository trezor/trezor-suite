import React from 'react';
import { useArgs } from '@storybook/client-api';

import { Switch } from '.';

export default {
    title: 'Form/Switch',
    args: { isSmall: false, isDisabled: false, isChecked: false },
};

export const Basic = ({ ...args }) => {
    const [{ isChecked }, updateArgs] = useArgs();
    const handleIsChecked = () => updateArgs({ isChecked: !isChecked });

    return (
        <Switch
            onChange={handleIsChecked}
            checked={isChecked}
            isSmall={args.isSmall}
            isDisabled={args.isDisabled}
        />
    );
};
