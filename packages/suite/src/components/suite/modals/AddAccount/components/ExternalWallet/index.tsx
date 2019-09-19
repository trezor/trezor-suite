import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { Button, H5, Link, P } from '@trezor/components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { ExternalNetwork } from '@wallet-types';
import l10nMessages from './messages';

const Wrapper = styled.div`
    width: 100%;
    max-width: 620px;
    padding: 10px 0px;
`;

const StyledButton = styled(Button)`
    margin-top: 10px;
    width: 100%;
`;

const Img = styled.img`
    display: block;
    max-width: 100px;
    margin: 0 auto;
    height: auto;
    padding-bottom: 20px;
`;

const getHeader = (symbol: string) => {
    switch (symbol) {
        case 'xem':
            return l10nMessages.TR_NEM_WALLET;
        case 'xlm':
            return l10nMessages.TR_STELLAR_WALLET;
        case 'ada':
            return l10nMessages.TR_CARDANO_WALLET;
        case 'xtz':
            return l10nMessages.TR_TEZOS_WALLET;
        default:
            return { id: 'unknown-external-wallet' };
    }
};

type Props = { onCancel: () => void } & ExternalNetwork;

const ExternalWallet = ({ symbol, url, onCancel }: Props) => (
    <Wrapper>
        <Img src={resolveStaticPath(`images/wallet/external-wallets/${symbol}.png`)} />
        <H5>
            <FormattedMessage {...getHeader(symbol)} />
        </H5>
        <P size="small">
            <FormattedMessage {...l10nMessages.TR_YOU_WILL_BE_REDIRECTED_TO_EXTERNAL} />
        </P>

        <Link href={url}>
            <StyledButton onClick={onCancel}>
                <FormattedMessage {...l10nMessages.TR_GO_TO_EXTERNAL_WALLET} />
            </StyledButton>
        </Link>
    </Wrapper>
);

export default ExternalWallet;
