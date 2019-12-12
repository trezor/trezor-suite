import React from 'react';
import { Switch } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { text, boolean } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/info';
import styled from 'styled-components';

const StyledSwitch = styled(Switch)``;

StyledSwitch.displayName = 'Switch';

storiesOf('Form', module).add(
    'Switch',
    () => {
        const checked = boolean('Active', false);
        const isSmall = boolean('Small', true);
        return isSmall ? (
            <Switch onChange={() => {}} checked={checked} isSmall />
        ) : (
            <StyledSwitch onChange={() => {}} checked={checked} />
        );
    },
    {
        info: {
            ...infoOptions,
            text: `
        ~~~js
        import { Checkbox } from 'trezor-ui-components';
        ~~~
        `,
        },
    }
);
