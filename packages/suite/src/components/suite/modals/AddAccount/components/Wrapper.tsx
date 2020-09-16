import React from 'react';
import styled from 'styled-components';
import { Button, colors, variables, Modal } from '@trezor/components';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import { Network, ExternalNetwork } from '@wallet-types';
import NetworkSelect from './NetworkSelect';
import AccountTypeSelect from './AccountTypeSelect';

const StyledModal = styled(Modal)`
    min-height: 540px;
`;

const Actions = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0px;

    & + & {
        border-top: 1px solid ${colors.BLACK96};
    }
`;

const RowTitle = styled.div`
    display: flex;
    color: ${colors.BLACK0};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Expander = styled.div`
    display: flex;
    flex: 1;
`;

type Props = {
    selectedNetwork: Network | ExternalNetwork;
    internalNetworks: Network[];
    externalNetworks: ExternalNetwork[];
    selectedAccountType?: Network;
    accountTypes?: Network[];
    onSelectNetwork: (network: Network | ExternalNetwork) => void;
    onSelectAccountType: (network: Network) => void;
    onCancel: () => void;
    children?: JSX.Element;
    actionButton?: JSX.Element;
};

const Wrapper = (props: Props) => (
    <StyledModal
        cancelable
        onCancel={props.onCancel}
        heading={<Translation {...messages.MODAL_ADD_ACCOUNT_TITLE} />}
        description={<Translation {...messages.MODAL_ADD_ACCOUNT_DESC} />}
    >
        <Row>
            <RowTitle>
                <Translation {...messages.TR_CRYPTOCURRENCY} />
            </RowTitle>
            <NetworkSelect
                network={props.selectedNetwork}
                internalNetworks={props.internalNetworks}
                externalNetworks={props.externalNetworks}
                setSelectedNetwork={props.onSelectNetwork}
            />
        </Row>
        {props.accountTypes && props.accountTypes.length > 1 && (
            <Row>
                <RowTitle>
                    <Translation {...messages.TR_ACCOUNT_TYPE} />
                </RowTitle>
                <AccountTypeSelect
                    network={props.selectedAccountType}
                    accountTypes={props.accountTypes}
                    onSelectAccountType={props.onSelectAccountType}
                />
            </Row>
        )}

        {props.children}

        <Expander />

        <Actions>
            <Button variant="secondary" onClick={props.onCancel}>
                <Translation {...messages.TR_CANCEL} />
            </Button>
            {props.actionButton}
        </Actions>
    </StyledModal>
);

export default Wrapper;
