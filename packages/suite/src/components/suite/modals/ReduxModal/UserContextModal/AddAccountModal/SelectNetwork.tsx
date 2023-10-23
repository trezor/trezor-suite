import styled, { css } from 'styled-components';
import { Icon, Paragraph, variables } from '@trezor/components';
import { FADE_IN } from '@trezor/components/src/config/animations';
import { CoinsList, Translation } from 'src/components/suite';
import type { Network } from 'src/types/wallet';

const Header = styled.div<{ disabled: boolean }>`
    display: flex;
    justify-content: flex-start;
    align-self: flex-start;
    align-items: center;
    margin-bottom: 18px;
    text-align: left;

    ${({ disabled }) =>
        disabled
            ? ''
            : css`
                  cursor: pointer;
              `}
`;

const Title = styled(Paragraph)`
    margin-right: 9px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const IconAnimated = styled(Icon)`
    @media (prefers-reduced-motion: no-preference) {
        animation: ${FADE_IN} ease 0.3s;
    }
`;

type SelectNetworkProps = {
    networks: Network[];
    networkCanChange: boolean;
    selectedNetworks: Network['symbol'][];
    handleNetworkSelection: (symbol?: Network['symbol']) => void;
};

export const SelectNetwork = ({
    networks,
    networkCanChange,
    selectedNetworks,
    handleNetworkSelection,
}: SelectNetworkProps) => {
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
                onToggle={handleNetworkSelection}
                networks={networks}
                selectedNetworks={selectedNetworks}
            />
        </>
    );
};
