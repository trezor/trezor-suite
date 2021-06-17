import React from 'react';
import styled, { css } from 'styled-components';
import { Icon, P, variables } from '@trezor/components';
import { FADE_IN } from '@trezor/components/lib/config/animations';

import { CoinsList, Translation, Modal } from '@suite-components';
import { Network } from '@wallet-types';
import { TrezorDevice } from '@suite-types';
import AccountTypeSelect from './AccountTypeSelect';

const StyledModal = styled(props => <Modal {...props} />)`
    min-height: 550px;
    text-align: left;
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
`;

const SelectCoin = styled.div<{ disabled: boolean }>`
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

const Expander = styled.div`
    display: flex;
    flex: 1;
`;

type Props = {
    network?: Network;
    networkEnabled: boolean;
    networkPinned?: boolean;
    enabledNetworks: Network[];
    disabledMainnetNetworks: Network[];
    disabledTestnetNetworks: Network[];
    accountTypes?: Network[];
    onSelectNetwork: (network?: Network) => void;
    onCancel: () => void;
    children?: JSX.Element;
    actionButton?: JSX.Element;
    unavailableCapabilities: TrezorDevice['unavailableCapabilities'];
};

const Wrapper = ({
    network,
    networkEnabled,
    networkPinned,
    accountTypes,
    actionButton,
    children,
    enabledNetworks,
    disabledMainnetNetworks,
    disabledTestnetNetworks,
    onCancel,
    onSelectNetwork,
    unavailableCapabilities,
}: Props) => {
    const networkCanChange = network && !networkPinned;

    const handleNetworkSelection = (networksList: Network[]) => (symbol: Network['symbol']) => {
        const selectedNetwork = networksList.find(n => n.symbol === symbol);
        if (selectedNetwork && !networkPinned) {
            onSelectNetwork(selectedNetwork);
        }
    };
    const resetNetworkSelection = () => {
        if (networkCanChange) {
            onSelectNetwork();
        }
    };

    const selectedNetworks = network ? [network.symbol] : [];

    return (
        <StyledModal
            cancelable
            onCancel={onCancel}
            heading={<Translation id="MODAL_ADD_ACCOUNT_TITLE" />}
        >
            <SelectCoin onClick={resetNetworkSelection} disabled={!networkCanChange}>
                <Title>
                    <Translation id="TR_SELECT_COIN" />
                </Title>
                {networkCanChange && <IconAnimated icon="PENCIL" size={12} useCursorPointer />}
            </SelectCoin>
            <CoinsList
                onToggleFn={handleNetworkSelection(enabledNetworks)}
                networks={network && networkEnabled ? [network] : enabledNetworks}
                selectedNetworks={selectedNetworks}
                unavailableCapabilities={unavailableCapabilities}
            />
            {!networkEnabled && (
                <>
                    <Title>inactive</Title>
                    <CoinsList
                        onToggleFn={handleNetworkSelection(disabledMainnetNetworks)}
                        networks={disabledMainnetNetworks}
                        selectedNetworks={selectedNetworks}
                        unavailableCapabilities={unavailableCapabilities}
                    />
                    <Title>testnet</Title>
                    <CoinsList
                        onToggleFn={handleNetworkSelection(disabledTestnetNetworks)}
                        networks={disabledTestnetNetworks}
                        selectedNetworks={selectedNetworks}
                        unavailableCapabilities={unavailableCapabilities}
                    />
                </>
            )}
            {accountTypes && accountTypes?.length > 1 && (
                <>
                    <Title>
                        <Translation id="TR_ACCOUNT_TYPE" />
                    </Title>
                    <AccountTypeSelect
                        network={network}
                        accountTypes={accountTypes}
                        onSelectAccountType={onSelectNetwork}
                    />
                </>
            )}

            {children}

            <Expander />

            <Actions>{actionButton}</Actions>
        </StyledModal>
    );
};

export default Wrapper;
