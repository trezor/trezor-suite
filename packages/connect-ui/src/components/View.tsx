import { ReactNode } from 'react';

import styled from 'styled-components';

import { H3, P, variables } from '@trezor/components';

const Title = styled(H3)`
    font-size: 19px;
    color: #333;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const StyledP = styled(P)`
    margin: 0 20%;
    font-size: 15px;
    font-weight: ${variables.FONT_WEIGHT.LIGHT};
    color: #757575;
`;

const Buttons = styled.div``;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;
    text-align: center;
    min-height: 70vh;
    margin-top: 10vh;
`;

const Body = styled.div``;

// common. each view should have title and optionally buttons
type ViewPropsBase = {
    title?: ReactNode;
    // todo: consider more detailed description of buttons (cta, alt...)
    buttons?: ReactNode;
};

// most of the components will be like this, description and image
type ViewPropsStrict = ViewPropsBase & {
    description: ReactNode;
    // todo: depends on how we will end up defining images, we could either pass component or only string identifier
    image: ReactNode;
};

// some of the components might be more complicated so we will need to pass custom body
type ViewPropsLoose = ViewPropsBase & {
    children: ReactNode;
};

export const View = (props: ViewPropsStrict | ViewPropsLoose) => (
    <Wrapper>
        <div>
            {'title' in props && <Title>{props.title}</Title>}
            {'description' in props && <StyledP>{props.description}</StyledP>}
        </div>
        <Body>{'children' in props ? props.children : <> {props.image}</>}</Body>

        {props.buttons && <Buttons>{props.buttons}</Buttons>}
    </Wrapper>
);
