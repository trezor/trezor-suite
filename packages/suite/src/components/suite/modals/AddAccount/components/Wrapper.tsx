import React from 'react';
import styled from 'styled-components';
import { colors, variables, Modal } from '@trezor/components';
import { Translation, ExternalLink } from '@suite-components';
import messages from '@suite/support/messages';
import { Network } from '@wallet-types';
import NetworkSelect from './NetworkSelect';
import AccountTypeSelect from './AccountTypeSelect';
import { TREZOR_COINS_URL } from '@suite-constants/urls';

const StyledModal = styled(Modal)`
    min-height: 540px;
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
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
    selectedNetwork: Network;
    internalNetworks: Network[];
    selectedAccountType?: Network;
    accountTypes?: Network[];
    onSelectNetwork: (network: Network) => void;
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
        description={
            <Translation
                {...messages.MODAL_ADD_ACCOUNT_DESC}
                values={{
                    trezorCoinsUrl: (
                        <ExternalLink size="small" href={TREZOR_COINS_URL}>
                            {TREZOR_COINS_URL}
                        </ExternalLink>
                    ),
                }}
            />
        }
    >
        <Row>
            <RowTitle>
                <Translation {...messages.TR_CRYPTOCURRENCY} />
            </RowTitle>
            <NetworkSelect
                network={props.selectedNetwork}
                internalNetworks={props.internalNetworks}
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

        <Actions>{props.actionButton}</Actions>
    </StyledModal>
);

export default Wrapper;
