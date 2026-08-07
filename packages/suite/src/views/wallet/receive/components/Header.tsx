import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { getNetworkDisplaySymbol , selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { H2, Paragraph } from '@trezor/components';

import { type Account } from 'src/types/wallet';

const Content = styled.div`
    margin: 0 0 24px;
`;

interface HeaderProps {
    account: Account;
}

export const Header = ({ account }: HeaderProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const title = (
        <Translation
            id="RECEIVE_TITLE"
            values={{
                networkDisplaySymbol: getNetworkDisplaySymbol(networkConfigDeps, account.symbol),
            }}
        />
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
                <Paragraph typographyStyle="body-xs">
                    <Translation id="RECEIVE_DESC_ETHEREUM" />
                </Paragraph>
            </Content>
        );
    }

    return <H2>{title}</H2>;
};
