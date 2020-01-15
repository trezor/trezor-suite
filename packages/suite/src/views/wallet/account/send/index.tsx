/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import styled, { css } from 'styled-components';
import { colors, Icon } from '@trezor/components-v2';
import { Output } from '@wallet-types/sendForm';
import AccountName from '@wallet-components/AccountName';

import { StateProps, DispatchProps } from './Container';
import { Content, LayoutAccount } from '@wallet-components';
import messages from '@suite/support/messages';

import Address from './components/Address';
import Amount from './components/Amount';
import Clear from './components/Clear';
import SendSection from './components/SendSection';
import AdditionalForm from './components/AdditionalForm';
import Add from './components/Add/Container';
import ButtonToggleAdditional from './components/ButtonToggleAdditional';

const Row = styled.div`
    display: flex;
    flex-direction: ${(props: { isColumn?: boolean }) => (props.isColumn ? 'column' : 'row')};
    padding: 0 0 30px 0;

    &:last-child {
        padding: 0;
    }
`;

const SlimRow = styled.div`
    display: flex;
    justify-content: flex-end;
    min-height: 10px;
    align-items: flex-end;

    ${(props: { isOnlyOne: boolean }) =>
        props.isOnlyOne &&
        css`
            display: none;
        `}
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const OutputWrapper = styled.div`
    padding: 23px 40px 60px 40px;
    border-radius: 6px;
    background: ${colors.BLACK96};
`;

const AdditionalInfoWrapper = styled.div`
    margin-top: 20px;
`;

const AdditionalFormHeader = styled.div`
    padding: 5px 40px;
    display: flex;
    justify-content: space-between;
    width: 100%;
    align-items: center;
`;

const Send = (props: StateProps & DispatchProps) => {
    const {
        device,
        suite,
        devices,
        sendFormActions,
        send,
        fees,
        fiat,
        sendFormActionsBitcoin,
        sendFormActionsEthereum,
        sendFormActionsRipple,
        accounts,
    } = props;

    useEffect(() => {
        props.sendFormActions.init();
    }, [props.selectedAccount]);

    if (!device || !send || !fees || props.selectedAccount.status !== 'loaded') {
        const { loader, exceptionPage } = props.selectedAccount;
        return (
            <LayoutAccount title="Send">
                <Content loader={loader} exceptionPage={exceptionPage} isLoading />
            </LayoutAccount>
        );
    }

    const { account, network } = props.selectedAccount;
    const accountNameMessage =
        account.networkType === 'ethereum'
            ? messages.TR_SEND_NETWORK_AND_TOKENS
            : messages.TR_SEND_NETWORK;

    return (
        <LayoutAccount title="Send">
            <AccountName account={account} message={accountNameMessage} />
            {send.outputs.map((output: Output) => (
                <OutputWrapper key={output.id}>
                    <Clear sendFormActions={sendFormActions} />
                    <SlimRow isOnlyOne={send.outputs.length === 1}>
                        <StyledIcon
                            onClick={() => props.sendFormActionsBitcoin.removeRecipient(output.id)}
                            size={10}
                            color={colors.BLACK92}
                            icon="CROSS"
                        />
                    </SlimRow>
                    <Row>
                        <Address
                            accounts={accounts}
                            devices={devices}
                            networkType={account.networkType}
                            outputId={output.id}
                            address={output.address.value}
                            error={output.address.error}
                            sendFormActions={sendFormActions}
                            openQrModal={props.openQrModal}
                        />
                    </Row>
                    <Row>
                        <Amount
                            outputId={output.id}
                            amount={output.amount.value}
                            canSetMax={(output.amount.value || 0) >= account.availableBalance}
                            symbol={account.symbol}
                            error={output.amount.error}
                            fiatValue={output.fiatValue.value}
                            fiat={fiat}
                            decimals={network.decimals}
                            localCurrency={output.localCurrency.value}
                            sendFormActions={sendFormActions}
                        />
                    </Row>
                </OutputWrapper>
            ))}
            <AdditionalInfoWrapper>
                <Row isColumn={send.isAdditionalFormVisible}>
                    <AdditionalFormHeader>
                        <ButtonToggleAdditional
                            isActive={send.isAdditionalFormVisible}
                            sendFormActions={sendFormActions}
                        />
                        <Add />
                    </AdditionalFormHeader>
                    {send.isAdditionalFormVisible && (
                        <AdditionalForm networkType={network.networkType} />
                    )}
                </Row>
            </AdditionalInfoWrapper>
            <SendSection
                isComposing={send.isComposing}
                send={send}
                suite={suite}
                device={device}
                networkType={account.networkType}
                symbol={network.symbol}
                sendFormActions={sendFormActions}
                sendFormActionsBitcoin={sendFormActionsBitcoin}
                sendFormActionsEthereum={sendFormActionsEthereum}
                sendFormActionsRipple={sendFormActionsRipple}
            />
        </LayoutAccount>
    );
};

export default Send;
