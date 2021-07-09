import React from 'react';
import styled, { css } from 'styled-components';
import { Icon, P, variables } from '@trezor/components';
import { FADE_IN } from '@trezor/components/lib/config/animations';

import { CoinsList, Translation } from '@suite-components';
import { Network } from '@wallet-types';
import { TrezorDevice } from '@suite-types';

const Header = styled.div<{ disabled: boolean }>`
    display: flex;
    justify-content: flex-start;
    align-self: flex-start;
    align-items: center;
    text-align: left;
    ${({ disabled }) =>
        disabled
            ? ''
            : css`
                  cursor: pointer;
              `}
`;

const Title = styled(P)`
    margin-right: 9px;
    padding: 14px 0%;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const IconAnimated = styled(Icon)`
    @media (prefers-reduced-motion: no-preference) {
        animation: ${FADE_IN} ease 0.3s;
    }
`;

type Props = {
    networks: Network[];
    networkCanChange: boolean;
    selectedNetworks: Network['symbol'][];
    handleNetworkSelection: (symbol?: Network['symbol']) => void;
    unavailableCapabilities: TrezorDevice['unavailableCapabilities'];
};

export const SelectNetwork = ({
    networks,
    networkCanChange,
    selectedNetworks,
    handleNetworkSelection,
    unavailableCapabilities,
}: Props) => {
    const resetNetworkSelection = () => {
        if (networkCanChange) {
            handleNetworkSelection();
        }
    };

    return (
        <>
            <Header onClick={resetNetworkSelection} disabled={!networkCanChange}>
                <Title>
                    <Translation id="TR_SELECT_COIN" />
                </Title>
                {networkCanChange && <IconAnimated icon="PENCIL" size={12} useCursorPointer />}
            </Header>
            <CoinsList
                onToggleFn={handleNetworkSelection}
                networks={networks}
                selectedNetworks={selectedNetworks}
                unavailableCapabilities={unavailableCapabilities}
            />
        </>
    );
};
