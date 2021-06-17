import React from 'react';
import styled from 'styled-components';
import { P, variables } from '@trezor/components';
import { Translation, Modal } from '@suite-components';
import { Network } from '@wallet-types';
import { TrezorDevice } from '@suite-types';
import AccountTypeSelect from './AccountTypeSelect';
import AddAccount from './AddAccount';
import EnableNetwork from './EnableNetwork';

const StyledModal = styled(props => <Modal {...props} />)`
    min-height: 550px;
    text-align: left;
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
`;

const Title = styled(P)`
    margin-right: 9px;
    padding: 14px 0%;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
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
    handleNetworkSelection: (symbol?: Network['symbol']) => void;
    handleAccountTypeSelection: (network?: Network) => void;
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
    handleNetworkSelection,
    handleAccountTypeSelection,
    unavailableCapabilities,
}: Props) => {
    const networkCanChange = !!network && networkEnabled && !networkPinned;
    const selectedNetworks = network ? [network.symbol] : [];

    return (
        <StyledModal
            cancelable
            onCancel={onCancel}
            heading={<Translation id="MODAL_ADD_ACCOUNT_TITLE" />}
        >
            <AddAccount
                networks={network && networkEnabled ? [network] : enabledNetworks}
                networkCanChange={networkCanChange}
                selectedNetworks={selectedNetworks}
                unavailableCapabilities={unavailableCapabilities}
                handleNetworkSelection={handleNetworkSelection}
            />
            {!networkEnabled && (
                <EnableNetwork
                    networks={disabledMainnetNetworks}
                    testnetNetworks={disabledTestnetNetworks}
                    selectedNetworks={selectedNetworks}
                    unavailableCapabilities={unavailableCapabilities}
                    handleNetworkSelection={handleNetworkSelection}
                />
            )}
            {accountTypes && accountTypes?.length > 1 && (
                <>
                    <Title>
                        <Translation id="TR_ACCOUNT_TYPE" />
                    </Title>
                    <AccountTypeSelect
                        network={network}
                        accountTypes={accountTypes}
                        onSelectAccountType={handleAccountTypeSelection}
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
