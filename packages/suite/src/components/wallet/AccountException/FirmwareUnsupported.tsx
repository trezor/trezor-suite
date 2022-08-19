import React from 'react';
import styled from 'styled-components';

import { CoinLogo, Button } from '@trezor/components';
import { WIKI_URL, WIKI_XRP_URL } from '@trezor/urls';
import { Translation, TrezorLink } from '@suite-components';
import { AccountExceptionLayout } from '@wallet-components';
import { ExtendedMessageDescriptor } from '@suite-types';
import { Account } from '@wallet-types';

interface Props {
    symbol?: Account['symbol'];
    title: ExtendedMessageDescriptor;
    message: ExtendedMessageDescriptor;
}

const getInfoUrl = (symbol?: Props['symbol']) => {
    let result;
    const urls = {
        default: WIKI_URL,
        xrp: WIKI_XRP_URL,
        txrp: WIKI_XRP_URL,
    };

    if (!symbol) {
        result = urls.default;
    } else if (symbol in urls) {
        // @ts-expect-error
        result = urls[symbol];
    } else {
        result = urls.default;
    }

    return result;
};

const CoinLogoWrapper = styled.div`
    margin: 10px 0 20px 0;
`;

const StyledCoinLogo = styled(CoinLogo)`
    width: 32px;
`;

// TODO this doesn't seem to be used anywhere
const FirmwareUnsupported = (props: Props) => (
    <AccountExceptionLayout
        title={<Translation {...props.title} />}
        description={<Translation {...props.message} />}
        imageComponent={
            props.symbol && (
                <CoinLogoWrapper>
                    <StyledCoinLogo symbol={props.symbol} />
                </CoinLogoWrapper>
            )
        }
        actionComponent={
            <TrezorLink href={getInfoUrl(props.symbol)}>
                <Button>
                    {/* TODO: use TR_LEARN_MORE? */}
                    <Translation id="TR_FIND_OUT_MORE_INFO" />
                </Button>
            </TrezorLink>
        }
    />
);

export default FirmwareUnsupported;
