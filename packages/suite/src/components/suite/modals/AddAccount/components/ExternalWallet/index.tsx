import React from 'react';
import { Translation } from '@suite-components/Translation';

import styled from 'styled-components';
import { CoinLogo } from '@trezor/components';
import { Button, H2, Link, P } from '@trezor/components-v2';
import { Network, ExternalNetwork } from '@wallet-types';
import l10nMessages from './messages';

const Wrapper = styled.div`
    width: 100%;
    max-width: 620px;
    padding: 10px 0 0;
`;

const StyledButton = styled(Button)`
    margin-top: 10px;
`;

const StyledCoinLogo = styled(CoinLogo)`
    margin-bottom: 10px;
`;

const getHeader = (symbol: ExternalNetwork['symbol']) => {
    switch (symbol) {
        case 'xem':
            return l10nMessages.TR_NEM_WALLET;
        case 'xlm':
            return l10nMessages.TR_STELLAR_WALLET;
        case 'ada':
            return l10nMessages.TR_CARDANO_WALLET;
        case 'xtz':
            return l10nMessages.TR_TEZOS_WALLET;
        // no default
    }
};

interface Props {
    selectedNetwork?: Network | ExternalNetwork;
    onCancel: () => void;
}

const ExternalWallet = ({ selectedNetwork, onCancel }: Props) => {
    if (!selectedNetwork || selectedNetwork.networkType !== 'external') return null;
    const { symbol, url } = selectedNetwork;
    return (
        <Wrapper>
            <StyledCoinLogo size={64} symbol={symbol} />
            <H2>
                <Translation>{getHeader(symbol)}</Translation>
            </H2>
            <P size="small">
                <Translation>{l10nMessages.TR_YOU_WILL_BE_REDIRECTED_TO_EXTERNAL}</Translation>
            </P>

            <Link href={url}>
                <StyledButton onClick={onCancel} fullWidth>
                    <Translation>{l10nMessages.TR_GO_TO_EXTERNAL_WALLET}</Translation>
                </StyledButton>
            </Link>
        </Wrapper>
    );
};

export default ExternalWallet;
