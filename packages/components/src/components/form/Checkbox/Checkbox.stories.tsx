import { useArgs } from '@storybook/client-api';

import { Checkbox as CheckboxComponent } from './Checkbox';

export default {
    title: 'Form/Checkbox',
    component: CheckboxComponent,
};

export const Checkbox = {
    render: ({ ...args }) => {
        // eslint-disable-next-line
        const [{ isChecked }, updateArgs] = useArgs();
        const handleIsChecked = () => updateArgs({ isChecked: !isChecked });

        return (
            <CheckboxComponent
                variant="primary"
                isChecked={isChecked}
                onClick={handleIsChecked}
                {...args}
            >
                {args.label}
            </CheckboxComponent>
        );
    },
    args: { label: 'Checkbox' },
};
