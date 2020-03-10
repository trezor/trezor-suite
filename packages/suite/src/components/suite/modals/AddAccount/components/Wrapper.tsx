import React from 'react';
import styled from 'styled-components';
import { H2, Button, colors, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import ModalWrapper from '@suite-components/ModalWrapper';
import messages from '@suite/support/messages';
import { Network, ExternalNetwork } from '@wallet-types';
import NetworkSelect from './NetworkSelect';
import AccountTypeSelect from './AccountTypeSelect';

const Wrapper = styled(ModalWrapper)`
    flex-direction: column;
    width: 100%;
    max-width: 600px;
    min-height: 530px;
`;

const Actions = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Description = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.BLACK50};
    margin-bottom: 32px;
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

type AllNetworks = Network | ExternalNetwork;
type Props = {
    selectedNetwork: AllNetworks;
    internalNetworks: Network[];
    externalNetworks: ExternalNetwork[];
    selectedAccountType?: Network;
    accountTypes?: Network[];
    onSelectNetwork: (network: AllNetworks) => void;
    onSelectAccountType: (network: Network) => void;
    onCancel: (_event: any) => void;
    children?: JSX.Element;
    actionButton?: JSX.Element;
};

export default (props: Props) => (
    <Wrapper>
        <H2>
            <Translation {...messages.MODAL_ADD_ACCOUNT_TITLE} />
        </H2>
        <Description>
            <Translation {...messages.MODAL_ADD_ACCOUNT_DESC} />
        </Description>

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
    </Wrapper>
);
