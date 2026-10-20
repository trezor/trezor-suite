import styled from 'styled-components';

import { type CustomEvmNetworkDefinition } from '@suite-common/wallet-types';
import { Column, Divider, Icon, Row, Text, commonFocusStyles } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';
import { NetworkIcon } from '@trezor/product-components';

export const CUSTOM_NETWORK_ROW_HEIGHT = 56;

const RowButton = styled.button`
    display: flex;
    flex: 1;
    align-items: center;
    padding: 0 16px;
    border: 0;
    background: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s ease-in-out;
    -webkit-app-region: no-drag;

    &:hover {
        background: ${({ theme }) => theme.elementFillGhostHovered};
    }

    &:focus-visible {
        ${commonFocusStyles}
    }
`;

type CustomNetworkListRowProps = {
    network: CustomEvmNetworkDefinition;
    hasDivider: boolean;
    onSelect: (network: CustomEvmNetworkDefinition) => void;
};

export const CustomNetworkListRow = ({
    network,
    hasDivider,
    onSelect,
}: CustomNetworkListRowProps) => (
    <Column height={CUSTOM_NETWORK_ROW_HEIGHT} width="100%">
        {hasDivider && <Divider margin={{}} />}
        <RowButton
            type="button"
            onClick={() => onSelect(network)}
            data-testid={`@add-custom-network/network/${network.chainId}`}
        >
            <Row gap={12} flex="1" minWidth={0}>
                <NetworkIcon size={32} networkSymbol={network.symbol} networkName={network.name} />
                <Text typographyStyle="body-md" ellipsisLineCount={1}>
                    {network.name}
                </Text>
            </Row>
            <Icon as={CaretRightIcon} size={16} intent="neutral" priority="secondary" />
        </RowButton>
    </Column>
);
