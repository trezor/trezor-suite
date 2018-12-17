/* @flow */
import React from 'react';
import styled from 'styled-components';
import colors from 'config/colors';

import { FONT_SIZE } from 'config/variables';
import { H2 } from 'components/Heading';
import Button from 'components/Button';
import Link from 'components/Link';
import CoinLogo from 'components/images/CoinLogo';

const getInfoUrl = (networkShortcut: ?string) => {
    const urls = {
        default: 'https://wiki.trezor.io',
        xrp: 'https://wiki.trezor.io/Ripple_(XRP)',
    };

    return networkShortcut ? urls[networkShortcut] : urls.default;
};

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

const CoinLogoWrapper = styled.div`
    margin: 10px 0;
`;

const StyledCoinLogo = styled(CoinLogo)`
    width: 32px;
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
const FirmwareOutdated = (props: Props) => {
    return (
        <Wrapper>
            <Row>
                {props.networkShortcut && <CoinLogoWrapper><StyledCoinLogo standalone network={props.networkShortcut} /></CoinLogoWrapper>}
                <H2>{props.title}</H2>
                <Message>{props.message}</Message>
                <StyledLink href={getInfoUrl(props.networkShortcut)}>
                    <Button>Find out more info</Button>
                </StyledLink>
            </Row>
        </Wrapper>
    );
};

export default FirmwareOutdated;
