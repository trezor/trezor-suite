/* @flow */
import React from 'react';
import styled from 'styled-components';
import colors from 'config/colors';

import { H1 } from 'components/Heading';
import Paragraph from 'components/Paragraph';
import Button from 'components/Button';
import Link from 'components/Link';
import CoinLogo from 'components/images/CoinLogo';

const getInfoUrl = (networkShortcut: ?string) => {
    const urls = {
        default: 'https://wiki.trezor.io',
        xrp: 'https://wiki.trezor.io/Ripple_(XRP)',
        txrp: 'https://wiki.trezor.io/Ripple_(XRP)',
    };
    return networkShortcut && urls[networkShortcut] ? urls[networkShortcut] : urls.default;
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

const Row = styled.div`
    display: flex;
    padding: 50px 0;
    
    flex-direction: column;
    align-items: center;
    text-align: center;
`;

const Message = styled(Paragraph)`
    padding: 0 0 15px 0;
    text-align: center;
`;

const FirmwareUnsupported = (props: Props) => (
    <Wrapper>
        <Row>
            {props.networkShortcut && <CoinLogoWrapper><StyledCoinLogo standalone network={props.networkShortcut} /></CoinLogoWrapper>}
            <H1>{props.title}</H1>
            <Message>{props.message}</Message>
            <Link href={getInfoUrl(props.networkShortcut)}>
                <Button>Find out more info</Button>
            </Link>
        </Row>
    </Wrapper>
);

export default FirmwareUnsupported;
