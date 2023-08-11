import React from 'react';
import { useArgs } from '@storybook/client-api';

import { Switch } from './Switch';

export default {
    title: 'Form/Switch',
    args: { isSmall: false, isDisabled: false, isChecked: false },
};

export const Basic = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ isChecked }, updateArgs] = useArgs();
        const handleIsChecked = () => updateArgs({ isChecked: !isChecked });

        return (
            <Switch
                onChange={handleIsChecked}
                isChecked={isChecked}
                isSmall={args.isSmall}
                isDisabled={args.isDisabled}
            />
        );
    },
};
