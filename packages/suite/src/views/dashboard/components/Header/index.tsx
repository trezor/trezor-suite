import React from 'react';
import { Button, ButtonGroup, H2 } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import styled from 'styled-components';

const Container = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 64px;
    padding-left: ${spacingsPx.md};
    padding-right: ${spacingsPx.md};
    margin-top: -${spacingsPx.xl};
    border-bottom: solid 1px ${({ theme }) => theme.borderOnElevation0};

    // Dirty hack to show header on fullscreen
    margin-left: calc(-50vw + 50%);
    width: 100vw;
`;

const Right = styled.div`
    display: flex;
    gap: ${spacingsPx.xs};
`;

// @TODO Add translations & onClick actions
export const Header = () => (
    <Container>
        <H2>Home</H2>
        <Right>
            <Button variant="tertiary" icon="SHOPPING_CART" size="small">
                Trade
            </Button>
            <ButtonGroup variant="tertiary" size="small">
                <Button icon="SEND">Send</Button>
                <Button icon="RECEIVE">Receive</Button>
            </ButtonGroup>
        </Right>
    </Container>
);
