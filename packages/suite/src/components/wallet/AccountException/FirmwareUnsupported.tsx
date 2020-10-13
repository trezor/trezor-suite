import React from 'react';
import styled from 'styled-components';

import { CoinLogo, colors, Button, H2, P, Link } from '@trezor/components';
import { Translation } from '@suite-components';
import { ExtendedMessageDescriptor } from '@suite-types';
import { Account } from '@wallet-types';

import { URLS } from '@suite-constants';

interface Props {
    symbol?: Account['symbol'];
    title: ExtendedMessageDescriptor;
    message: ExtendedMessageDescriptor;
}

const getInfoUrl = (symbol?: Props['symbol']) => {
    let result;
    const urls = {
        default: URLS.WIKI_URL,
        xrp: URLS.XRP_MANUAL_URL,
        txrp: URLS.XRP_MANUAL_URL,
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
            <H2>
                <Translation {...props.title} />
            </H2>
            <Message>
                <Translation {...props.message} />
            </Message>
            <Link href={getInfoUrl(props.symbol)}>
                <Button>
                    {/* TODO: use TR_LEARN_MORE? */}
                    <Translation id="TR_FIND_OUT_MORE_INFO" />
                </Button>
            </Link>
        </Row>
    </Wrapper>
);

export default FirmwareUnsupported;
