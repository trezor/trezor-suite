import React from 'react';
import { Switch } from '../../../index';
import { storiesOf } from '@storybook/react';
import { boolean } from '@storybook/addon-knobs';
import styled from 'styled-components';

const StyledSwitch = styled(Switch)``;

StyledSwitch.displayName = 'Switch';

storiesOf('Form', module).add('Switch', () => {
    const checked = boolean('Active', false);
    const isSmall = boolean('Small', true);
    const isDisabled = boolean('Disabled', false);

    return isSmall ? (
        <Switch
            onChange={() => {}}
            checked={checked}
            {...(isDisabled ? { isDisabled } : {})}
            isSmall
        />
    ) : (
        <StyledSwitch
            onChange={() => {}}
            {...(isDisabled ? { isDisabled } : {})}
            checked={checked}
        />
    );
});
