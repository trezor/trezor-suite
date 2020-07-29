import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { Offer, colors } from '../../../index';

const Wrapper = styled.div`
    margin: 10px 0;
    padding: 20px;
    flex: 1;
    background: ${colors.NEUE_BG_GRAY};
`;

storiesOf('Others', module).add('Offer', () => {
    return (
        <Wrapper>
            <Offer />
        </Wrapper>
    );
});
