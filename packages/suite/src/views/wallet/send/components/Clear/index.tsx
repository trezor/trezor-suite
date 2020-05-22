import React from 'react';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { colors, Button } from '@trezor/components';
import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
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
                <Button
                    variant="tertiary"
                    isDisabled={!touched}
                    icon="CLEAR"
                    alignIcon="left"
                    data-test="@send/clear-all-button"
                >
                    <Translation id="TR_CLEAR_ALL" />
                </Button>
            </In>
        </Wrapper>
    );
};
