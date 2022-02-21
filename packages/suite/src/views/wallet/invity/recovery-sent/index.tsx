import React from 'react';
import styled from 'styled-components';
import { InvityLayout, withSelectedAccountLoaded } from '@wallet-components';
import { InvityLayoutProps } from '@suite/components/wallet/InvityLayout';
import { Translation } from '@suite-components';
import { resolveStaticPath } from '@suite/utils/suite/build';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const SpecularImg = styled.img`
    margin: 64px 0;
    align-self: center;
`;

const Header = styled.div`
    font-size: 24px;
    align-self: center;
    margin-bottom: 12px;
`;

const Description = styled.div`
    align-self: center;
`;

const CoinmarketSavingsRecoverySent = ({ selectedAccount }: InvityLayoutProps) => (
    <InvityLayout selectedAccount={selectedAccount}>
        <Wrapper>
            <SpecularImg src={resolveStaticPath('images/suite/3d/folder.png')} alt="" />
            <Header>
                <Translation id="TR_SAVINGS_RECOVERY_SENT_HEADER" />
            </Header>
            <Description>
                <Translation id="TR_SAVINGS_RECOVERY_SENT_DESCRIPTION" />
            </Description>
        </Wrapper>
    </InvityLayout>
);

export default withSelectedAccountLoaded(CoinmarketSavingsRecoverySent, {
    title: 'TR_NAV_INVITY',
    redirectUnauthorizedUserToLogin: false,
});
