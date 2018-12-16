/* @flow */
import React from 'react';
import styled from 'styled-components';
import colors from 'config/colors';

import { FONT_SIZE } from 'config/variables';
import { H2 } from 'components/Heading';
import Button from 'components/Button';
import Link from 'components/Link';
import CoinLogo from 'components/images/CoinLogo';


type Props = {
    networkShortcut: ?string,
    title: ?string,
    message: ?string,
}

const Wrapper = styled.div`
    display: flex;
    background: ${colors.WHITE};
    flex-direction: column;
    flex: 1;
`;

const StyledCoinLogo = styled(CoinLogo)`
    margin: 10px 0;
    padding: 0;
    width: auto;
`;

const StyledLink = styled(Link)`
    padding-top: 24px;
`;

const Row = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const Message = styled.div`
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
    text-align: center;
`;

// eslint-disable-next-line arrow-body-style
const FirmwareUnsupported = (props: Props) => {
    return (
        <Wrapper>
            <Row>
                {props.networkShortcut && <StyledCoinLogo network={props.networkShortcut} />}
                <H2>{props.title}</H2>
                <Message>{props.message}</Message>
                <StyledLink href="https://wiki.trezor.io/">
                    <Button>Find out more info</Button>
                </StyledLink>
            </Row>
        </Wrapper>
    );
};

export default FirmwareUnsupported;
