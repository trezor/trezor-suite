import { useArgs } from '@storybook/client-api';

import { Switch as SwitchComponent } from './Switch';

export default {
    title: 'Form/Switch',
};

export const Switch = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ isChecked }, updateArgs] = useArgs();
        const handleIsChecked = () => updateArgs({ isChecked: !isChecked });

        return (
            <SwitchComponent
                onChange={handleIsChecked}
                isChecked={isChecked}
                isSmall={args.isSmall}
                isDisabled={args.isDisabled}
            />
        );
    },
    args: { isSmall: false, isDisabled: false, isChecked: false },
};
