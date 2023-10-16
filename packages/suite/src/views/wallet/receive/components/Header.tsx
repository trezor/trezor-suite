import { H2, P } from '@trezor/components';
import { Account } from 'src/types/wallet';
import styled from 'styled-components';
import { Translation } from 'src/components/suite';

const Content = styled.div`
    margin: 0 0 24px 0;
`;

interface HeaderProps {
    account: Account;
}

export const Header = ({ account }: HeaderProps) => {
    const title = (
        <Translation id="RECEIVE_TITLE" values={{ symbol: account.symbol.toUpperCase() }} />
    );
    if (account.networkType === 'bitcoin') {
        return (
            <Content>
                <H2>{title}</H2>
                {/* temp disable description to get consistent looks across tabs */}
                {/* <P type="label">
                    <Translation id="RECEIVE_DESC_BITCOIN" />
                </P> */}
            </Content>
        );
    }
    if (account.networkType === 'ethereum') {
        return (
            <Content>
                <H2>{title}</H2>
                <P type="label">
                    <Translation id="RECEIVE_DESC_ETHEREUM" />
                </P>
            </Content>
        );
    }
    return <H2>{title}</H2>;
};
