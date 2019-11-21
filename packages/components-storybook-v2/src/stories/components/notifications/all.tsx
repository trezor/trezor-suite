import React from 'react';
import styled from 'styled-components';
import { Notification, colors } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    background: ${colors.BLACK96};
    padding: 2rem;
`;

storiesOf('Notifications', module).add(
    'All',
    () => {
        return (
            <Wrapper>
                <Notification title="Notification title" description="Notification description" />
            </Wrapper>
        );
    },
    {
        info: {
            disable: true,
        },
    }
);
