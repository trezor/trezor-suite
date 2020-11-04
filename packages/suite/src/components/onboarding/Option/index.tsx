import React from 'react';
import styled from 'styled-components';
import { Button, variables } from '@trezor/components';

import { resolveStaticPath } from '@suite-utils/nextjs';

const { FONT_SIZE } = variables;

type Variant = 2 | 3;
interface WrapperProps {
    variant?: Variant;
}

const Wrapper = styled.div<WrapperProps>`
    width: ${({ variant }) => (variant === 2 ? '260px' : '160px')};
    max-height: ${({ variant }) => (variant === 2 ? '340px' : '240px')};
    padding: 20px 30px 10px 30px;
    margin: 2%;
    border-radius: 6px;
    display: flex;
    flex-direction: column;

    &:hover {
        box-shadow: 0px 0px 6px 2px rgba(0, 0, 0, 0.05);
    }
`;

const Image = styled.img`
    height: 92px;
    margin-bottom: 20px;
`;

const Title = styled.div`
    font-size: ${FONT_SIZE.BIG};
    margin-bottom: 12px;

    ::first-letter {
        text-transform: capitalize;
    }
`;

const Text = styled.div`
    font-size: ${FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const StyledButton = styled(Button)`
    margin-top: auto;
`;
interface Props {
    imgSrc?: string;
    title?: React.ReactNode;
    text?: React.ReactNode;
    action: () => void;
    button: React.ReactNode;
    variant?: Variant;
    'data-test'?: string;
}

const Option = (props: Props) => {
    const { imgSrc, title, text, action, button, variant } = props;
    return (
        <Wrapper variant={variant || 2}>
            {imgSrc && <Image src={resolveStaticPath(imgSrc)} />}
            <Title>{title}</Title>
            <Text>{text}</Text>
            <StyledButton onClick={action} data-test={props['data-test']}>
                {button}
            </StyledButton>
        </Wrapper>
    );
};

export default Option;
