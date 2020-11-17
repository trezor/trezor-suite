import React from 'react';
import styled from 'styled-components';
import { H2, Button } from '@trezor/components';
import { Translation, Image, TrezorLink } from '@suite-components';
import { Account } from '@wallet-types';
import { getNetwork } from '@wallet-utils/accountUtils';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Title = styled(H2)`
    display: flex;
    text-align: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const StyledImage = styled(props => <Image {...props} />)`
    width: 340px;
    height: 280px;
    margin-bottom: 40px;
`;

interface Props {
    account: Account;
}

const NoTransactions = ({ account }: Props) => {
    const network = getNetwork(account.symbol)!;
    const explorerUrl = `${network.explorer.account}${account.descriptor}`;
    return (
        <Wrapper>
            <Title>
                <Translation id="TR_TRANSACTIONS_NOT_AVAILABLE" />
            </Title>
            <StyledImage image="EMPTY_WALLET" />
            <Button variant="primary" icon="EXTERNAL_LINK" alignIcon="right">
                <TrezorLink variant="nostyle" href={explorerUrl}>
                    <Translation id="TR_SHOW_DETAILS_IN_BLOCK_EXPLORER" />
                </TrezorLink>
            </Button>
        </Wrapper>
    );
};

export default NoTransactions;
