import React from 'react';

import styled from 'styled-components';

import { Button, colors, variables } from '@trezor/components';

export interface SuccessViewProps {
    type: 'success';
}

const View = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
`;

const InnerWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const H = styled.h1`
    color: ${colors.TYPE_RED};
    font-size: 28px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Text = styled.div`
    color: ${colors.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

export const SuccessView = () => (
    <View data-test="@connect-ui/success">
        <InnerWrapper>
            <H>Success</H>
            <Text>Your request to Trezor device has been successful.</Text>

            <Button
                data-test="@connect-ui/success-close-button"
                variant="primary"
                onClick={() => window.close()}
            >
                Close
            </Button>
        </InnerWrapper>
    </View>
);
