import styled from 'styled-components';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { colors, Switch, CoinLogo, Tooltip, Icon, variables } from '@trezor/components';
import { ExtendedMessageDescriptor } from '@suite-types';
import { Network } from '@wallet-types';
import l10nMessages from '../../index.messages';
import { Props as BaseProps } from '../../Container';
import { NETWORKS } from '@wallet-config';

const { FONT_SIZE } = variables;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
`;

const Content = styled.div`
    display: flex;
    margin: 20px 0;
    flex-direction: column;
`;

const Label = styled.div`
    display: flex;
    padding: 10px 0;
    justify-content: space-between;
    color: ${colors.TEXT_SECONDARY};
    align-items: center;
`;

const TooltipIcon = styled(Icon)`
    margin-left: 6px;
    cursor: pointer;
`;

const CoinRowWrapper = styled.div`
    height: 50px;
    align-items: center;
    display: flex;
    border-bottom: 1px solid ${colors.DIVIDER};
    color: ${colors.TEXT_PRIMARY};
    justify-content: space-between;

    &:first-child {
        border-top: 1px solid ${colors.DIVIDER};
    }

    &:last-child {
        border-bottom: 0;
    }
`;

const Left = styled.div`
    display: flex;
    align-items: center;
`;

const Right = styled.div`
    display: flex;
    align-items: center;
`;

const Name = styled.div`
    display: flex;
    font-size: ${FONT_SIZE.BIG};
    color: ${colors.TEXT_PRIMARY};
`;

const LogoWrapper = styled.div`
    display: flex;
    width: 45px;
    justify-content: center;
    align-items: center;
`;

const ToggleAll = styled.div`
    cursor: pointer;
`;

interface CoinRowProps {
    network: Network;
    checked: boolean;
    changeCoinVisibility: BaseProps['changeCoinVisibility'];
}

const CoinRow = ({ network, checked, changeCoinVisibility }: CoinRowProps) => (
    <CoinRowWrapper>
        <Left>
            <LogoWrapper>
                <CoinLogo size={24} symbol={network.symbol} />
            </LogoWrapper>
            <Name>{network.name}</Name>
        </Left>
        <Right>
            <Switch
                isSmall
                checkedIcon={false}
                uncheckedIcon={false}
                onChange={visible => {
                    changeCoinVisibility(network.symbol, visible);
                }}
                checked={checked}
            />
        </Right>
    </CoinRowWrapper>
);

interface CoinsGroupProps {
    title: ExtendedMessageDescriptor;
    tooltip: ExtendedMessageDescriptor;
    toggleGroupCoinsVisibility: BaseProps['toggleGroupCoinsVisibility'];
    changeCoinVisibility: BaseProps['changeCoinVisibility'];
    networksFilterFn?: (n: Network) => boolean | undefined;
    enabledNetworks: Network['symbol'][];
    networks: Network[];
}

const CoinsGroup = (props: CoinsGroupProps) => {
    const { title, tooltip, toggleGroupCoinsVisibility, networks, networksFilterFn } = props;
    let filteredNetworks = networks.filter(n => !n.accountType);
    if (networksFilterFn) {
        filteredNetworks = filteredNetworks.filter(networksFilterFn);
    }
    const showAll = !filteredNetworks.some(checked =>
        props.enabledNetworks.includes(checked.symbol),
    );

    const rows = filteredNetworks.map(network => (
        <CoinRow
            network={network}
            checked={props.enabledNetworks.includes(network.symbol)}
            changeCoinVisibility={props.changeCoinVisibility}
            key={network.symbol}
        ></CoinRow>
    ));
    return (
        <Content>
            <Label>
                <Left>
                    {title && <FormattedMessage {...title} />}
                    {tooltip && (
                        <Tooltip
                            content={<FormattedMessage {...tooltip} />}
                            maxWidth={210}
                            placement="right"
                        >
                            <TooltipIcon icon="HELP" color={colors.TEXT_SECONDARY} size={12} />
                        </Tooltip>
                    )}
                </Left>
                <Right>
                    <ToggleAll
                        onClick={() => {
                            toggleGroupCoinsVisibility(networksFilterFn);
                        }}
                    >
                        {showAll ? 'Show all' : 'Hide all'}
                    </ToggleAll>
                </Right>
            </Label>
            {rows}
        </Content>
    );
};

interface Props {
    enabledNetworks: Network['symbol'][];
    changeCoinVisibility: BaseProps['changeCoinVisibility'];
    toggleGroupCoinsVisibility: BaseProps['toggleGroupCoinsVisibility'];
}

const CoinsSettings = (props: Props) => {
    const { enabledNetworks, changeCoinVisibility, toggleGroupCoinsVisibility } = props;

    return (
        <Wrapper>
            <Row>
                <CoinsGroup
                    title={l10nMessages.TR_VISIBLE_COINS}
                    tooltip={l10nMessages.TR_VISIBLE_COINS_EXPLAINED}
                    networksFilterFn={(n: Network) => n && !n.testnet}
                    networks={NETWORKS}
                    enabledNetworks={enabledNetworks}
                    toggleGroupCoinsVisibility={toggleGroupCoinsVisibility}
                    changeCoinVisibility={changeCoinVisibility}
                />
                <CoinsGroup
                    title={l10nMessages.TR_VISIBLE_TESTNET_COINS}
                    tooltip={l10nMessages.TR_VISIBLE_TESTNET_COINS_EXPLAINED}
                    networksFilterFn={(n: Network) => 'testnet' in n && n.testnet}
                    networks={NETWORKS}
                    enabledNetworks={enabledNetworks}
                    toggleGroupCoinsVisibility={toggleGroupCoinsVisibility}
                    changeCoinVisibility={changeCoinVisibility}
                />
            </Row>
        </Wrapper>
    );
};

export default CoinsSettings;
