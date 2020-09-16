import React from 'react';
import styled from 'styled-components';
import { H2, P, colors } from '@trezor/components';
import { ExternalNetwork } from '@wallet-types';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';

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
            return messages.MODAL_ADD_ACCOUNT_NEM_WALLET;
        case 'xlm':
            return messages.MODAL_ADD_ACCOUNT_STELLAR_WALLET;
        case 'ada':
            return messages.MODAL_ADD_ACCOUNT_CARDANO_WALLET;
        case 'xtz':
            return messages.MODAL_ADD_ACCOUNT_TEZOS_WALLET;
        // no default
    }
};

interface Props {
    network: ExternalNetwork;
}

const NetworkExternal = ({ network }: Props) => (
    <Wrapper>
        <H2>
            <Translation {...getHeader(network.symbol)} />
        </H2>
        <StyledP size="small">
            <Translation {...messages.MODAL_ADD_ACCOUNT_NETWORK_EXTERNAL_DESC} />
        </StyledP>
    </Wrapper>
);

export default NetworkExternal;
