import React, { useState } from 'react';
import { text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import { Checkbox } from '.';

storiesOf('Form', module).add('Checkbox', () => {
    const [isChecked, setIsChecked] = useState(false);

    const label = text('Label', 'Checkbox');

    return (
        <Checkbox isChecked={isChecked} onClick={() => setIsChecked(!isChecked)}>
            {label}
        </Checkbox>
    );
});
