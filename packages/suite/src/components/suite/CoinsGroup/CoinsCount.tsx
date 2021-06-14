import React from 'react';
import { variables } from '@trezor/components';
import styled from 'styled-components';
import { Network } from '@wallet-types';
import { Translation } from '@suite-components';
import { useDevice } from '@suite-hooks';

const Wrapper = styled.div`
    margin: 31px 0 27px 0;
    align-self: flex-start;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: lowercase;
`;

interface Props {
    networks: Network[];
    enabledNetworks: Network['symbol'][];
    label: React.ReactNode;
}

const CoinsCount = ({ networks, enabledNetworks, label }: Props) => {
    const { device } = useDevice();
    if (!device) return null;

    return (
        <Wrapper>
            {networks.length} {label}
            {' • '}
            {enabledNetworks.length} <Translation id="TR_ACTIVE" />
        </Wrapper>
    );
};

export default CoinsCount;
