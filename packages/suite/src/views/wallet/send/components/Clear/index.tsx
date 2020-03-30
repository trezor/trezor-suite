import React from 'react';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { colors, Button } from '@trezor/components';
import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin: 8px 0 16px 0;
`;

const In = styled.div`
    cursor: pointer;
    display: flex;
    align-items: center;
    color: ${colors.BLACK50};
`;

export default ({ sendFormActions, send }: Props) => {
    if (!send) return null;
    const { touched } = send;
    return (
        <Wrapper>
            <In onClick={() => sendFormActions.clear()}>
                <Button variant="tertiary" isDisabled={!touched} icon="CROSS" alignIcon="right">
                    <Translation id="TR_CLEAR" />
                </Button>
            </In>
        </Wrapper>
    );
};
