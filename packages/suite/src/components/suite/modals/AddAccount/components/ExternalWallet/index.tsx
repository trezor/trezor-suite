import React from 'react';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import styled from 'styled-components';
import { H2, P, colors } from '@trezor/components';
import { Network, ExternalNetwork } from '@wallet-types';

const Wrapper = styled.div`
    width: 100%;
    margin-top: 20px;
    color: ${colors.BLACK50};
`;

const StyledP = styled(P)`
    color: ${colors.BLACK50};
`;

const getHeader = (symbol: ExternalNetwork['symbol']) => {
    switch (symbol) {
        case 'xem':
            return messages.TR_NEM_WALLET;
        case 'xlm':
            return messages.TR_STELLAR_WALLET;
        case 'ada':
            return messages.TR_CARDANO_WALLET;
        case 'xtz':
            return messages.TR_TEZOS_WALLET;
        // no default
    }
};

interface Props {
    selectedNetwork?: Network | ExternalNetwork;
}

const ExternalWallet = ({ selectedNetwork }: Props) => {
    if (!selectedNetwork || selectedNetwork.networkType !== 'external') return null;
    const { symbol } = selectedNetwork;
    return (
        <Wrapper>
            <H2>
                <Translation {...getHeader(symbol)} />
            </H2>
            <StyledP size="small">
                This coin is only accessible via an external wallet. It is supported by Trezor but
                not by Trezor Suite app.
            </StyledP>
        </Wrapper>
    );
};

export default ExternalWallet;
