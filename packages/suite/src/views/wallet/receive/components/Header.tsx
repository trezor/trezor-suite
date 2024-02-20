import { H2, Paragraph } from '@trezor/components';
import { Account } from 'src/types/wallet';
import styled from 'styled-components';
import { Translation } from 'src/components/suite';

const Content = styled.div`
    margin: 0 0 24px;
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
                {/* <Paragraph type="label">
                    <Translation id="RECEIVE_DESC_BITCOIN" />
                </Paragraph> */}
            </Content>
        );
    }
    if (account.networkType === 'ethereum') {
        return (
            <Content>
                <H2>{title}</H2>
                <Paragraph type="label">
                    <Translation id="RECEIVE_DESC_ETHEREUM" />
                </Paragraph>
            </Content>
        );
    }

    return <H2>{title}</H2>;
};
