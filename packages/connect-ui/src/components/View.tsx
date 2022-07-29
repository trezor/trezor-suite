import React from 'react';

import styled from 'styled-components';

import { H3, P } from '@trezor/components';

const StyledP = styled(P)`
    margin: 8% 24%;
`;
const Buttons = styled.div`
    margin-top: 8%;
`;

const Body = styled.div``;

// common. each view should have title and optionally buttons
type ViewPropsBase = {
    title: string;
    // todo: consider more detailed description of buttons (cta, alt...)
    buttons?: React.ReactNode;
};

// most of the components will be like this, description and image
type ViewPropsStrict = ViewPropsBase & {
    description: string;
    // todo: depends on how we will end up defining images, we could either pass component or only string identifier
    image: React.ReactNode;
};

// some of the components might be more complicated so we will need to pass custom body
type ViewPropsLoose = ViewPropsBase & {
    children: React.ReactNode;
};

export const View = (props: ViewPropsStrict | ViewPropsLoose) => (
    <>
        <H3>{props.title}</H3>
        {'children' in props ? (
            props.children
        ) : (
            <>
                <Body>
                    <StyledP>{props.description}</StyledP>
                    {props.image}
                </Body>
            </>
        )}
        {props.buttons && <Buttons>{props.buttons}</Buttons>}
    </>
);
