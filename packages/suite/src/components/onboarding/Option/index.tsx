import React from 'react';
import styled from 'styled-components';
import { Button, variables, colors } from '@trezor/components-v2';

import { resolveStaticPath } from '@suite-utils/nextjs';

const { FONT_SIZE } = variables;

const Wrapper = styled.div`
    width: 260px;
    height: 350px;
    padding: 20px 30px 30px 30px;
    margin: 2%;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;

    &:hover {
        box-shadow: 0px 0px 6px 2px rgba(0, 0, 0, 0.05);
    }
`;

const Image = styled.img``;

const Title = styled.div`
    font-size: ${FONT_SIZE.NORMAL};
`;

const Text = styled.div`
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.BLACK50};
`;

interface Props {
    imgSrc?: string;
    title: React.ReactNode;
    text: React.ReactNode;
    action: () => void;
    button: React.ReactNode;
    'data-test'?: string;
}

const Option = (props: Props) => {
    const { imgSrc, title, text, action, button } = props;
    return (
        <Wrapper>
            {imgSrc && <Image src={resolveStaticPath(imgSrc)} />}
            <Title>{title}</Title>
            <Text>{text}</Text>
            <Button onClick={action} data-test={props['data-test']}>
                {button}
            </Button>
        </Wrapper>
    );
};

export default Option;
