import React, { useEffect } from 'react';
import styled, { css } from 'styled-components';
import { WrappedComponentProps } from 'react-intl';
import { CoinLogo, Icon, colors } from '@trezor/components';
import { Output } from '@wallet-types/sendForm';

import { getTitleForNetwork, getTypeForNetwork } from '@wallet-utils/accountUtils';
import { StateProps, DispatchProps } from './Container';
import { Content, Title, LayoutAccount } from '@wallet-components';
import {
    Address,
    Amount,
    Fee,
    SendAndClear,
    AdditionalForm,
    ButtonToggleAdditional,
} from './components';

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
    padding: 0 0 30px 0;
`;

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 10px;
`;

const StyledTitle = styled(Title)`
    display: flex;
    align-items: center;
`;

const Send = (props: WrappedComponentProps & StateProps & DispatchProps) => {
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
        sendFormActions.init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.selectedAccount]);

    const { account, network, discovery, shouldRender } = props.selectedAccount;

    if (!device || !send || !account || !discovery || !network || !fees || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return (
            <LayoutAccount title="Send">
                <Content loader={loader} exceptionPage={exceptionPage} isLoading />
            </LayoutAccount>
        );
    }

    const accountType = getTypeForNetwork(account.accountType, props.intl);

    return (
        <LayoutAccount title="Send">
            <StyledTitle>
                <StyledCoinLogo size={24} symbol={account.symbol} />
                Send {getTitleForNetwork(network.symbol, props.intl)}
                {accountType ? ` (${accountType})` : ''}
            </StyledTitle>
            {send.outputs.map((output: Output) => (
                <OutputWrapper key={output.id}>
                    <SlimRow isOnlyOne={send.outputs.length === 1}>
                        <StyledIcon
                            onClick={() => props.sendFormActionsBitcoin.removeRecipient(output.id)}
                            size={10}
                            color={colors.TEXT_SECONDARY}
                            icon="CLOSE"
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
            <Row>
                <Fee
                    feeLevels={send.feeInfo.levels}
                    selectedFee={send.selectedFee}
                    onChange={sendFormActions.handleFeeValueChange}
                    symbol={network.symbol}
                />
            </Row>
            <Row isColumn={send.isAdditionalFormVisible}>
                <ButtonToggleAdditional
                    isActive={send.isAdditionalFormVisible}
                    sendFormActions={sendFormActions}
                />
                {send.isAdditionalFormVisible && (
                    <AdditionalForm networkType={network.networkType} />
                )}
                <SendAndClear
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
            </Row>
        </LayoutAccount>
    );
};

export default Send;
