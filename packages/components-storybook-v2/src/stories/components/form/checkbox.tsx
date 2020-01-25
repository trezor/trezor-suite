import React from 'react';
import { Checkbox } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { text, boolean } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/info';
import { StoryWrapper } from '../../../components/Story';

storiesOf('Form', module).add(
    'Checkbox',
    () => {
        const isChecked = boolean('Checked', false);
        return (
            <StoryWrapper>
                <Checkbox onClick={() => {}} {...(isChecked ? { isChecked } : {})}>
                    {text('Label', 'Checkbox')}
                </Checkbox>
            </StoryWrapper>
        );
    },
    {
        info: {
            ...infoOptions,
            text: `
        ~~~js
        import { Checkbox } from '@trezor/components-v2';
        ~~~
        `,
        },
    }
);
