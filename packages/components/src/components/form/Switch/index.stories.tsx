import React, { useState } from 'react';
import { Switch } from '../../../index';
import { storiesOf } from '@storybook/react';
import { boolean } from '@storybook/addon-knobs';

storiesOf('Form', module).add('Switch', () => {
    const [isChecked, setIsChecked] = useState(false);
    const isSmall = boolean('Small', false);
    const isDisabled = boolean('Disabled', false);

    return (
        <Switch
            onChange={setIsChecked}
            checked={isChecked}
            isSmall={isSmall}
            isDisabled={isDisabled}
        />
    );
});
