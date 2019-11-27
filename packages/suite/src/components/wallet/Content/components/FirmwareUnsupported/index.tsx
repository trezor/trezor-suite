import React from 'react';
import styled from 'styled-components';

import { CoinLogo, H4, P, Link, colors } from '@trezor/components';
import { Button } from '@trezor/components-v2';

import { Translation } from '@suite-components/Translation';
import { ExtendedMessageDescriptor } from '@suite/types/suite';
import l10nMessages from './index.messages';

interface Props {
    symbol?: string | null;
    title?: string | ExtendedMessageDescriptor;
    message?: string | ExtendedMessageDescriptor;
}

const getInfoUrl = (symbol?: Props['symbol']) => {
    let result;
    const urls = {
        default: 'https://wiki.trezor.io',
        xrp: 'https://wiki.trezor.io/Ripple_(XRP)',
        txrp: 'https://wiki.trezor.io/Ripple_(XRP)',
    };

    if (!symbol) {
        result = urls.default;
    } else if (symbol in urls) {
        // @ts-ignore
        result = urls[symbol];
    } else {
        result = urls.default;
    }

    return result;
};

const Wrapper = styled.div`
    display: flex;
    background: ${colors.WHITE};
    flex-direction: column;
    flex: 1;
`;

const CoinLogoWrapper = styled.div`
    margin: 10px 0 20px 0;
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

const Message = styled(P)`
    padding: 0 0 15px 0;
    text-align: center;
`;

const FirmwareUnsupported = (props: Props) => (
    <Wrapper>
        <Row>
            {props.symbol && (
                <CoinLogoWrapper>
                    <StyledCoinLogo symbol={props.symbol} />
                </CoinLogoWrapper>
            )}
            <H4>
                <Translation>{props.title}</Translation>
            </H4>
            <Message>
                <Translation>{props.message}</Translation>
            </Message>
            <Link href={getInfoUrl(props.symbol)} variant="nostyle">
                <Button inlineWidth>
                    <Translation {...l10nMessages.TR_FIND_OUT_MORE_INFO} />
                </Button>
            </Link>
        </Row>
    </Wrapper>
);

export default FirmwareUnsupported;
