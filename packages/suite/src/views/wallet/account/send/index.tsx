import React from 'react';
import styled from 'styled-components';
import { InjectedIntl } from 'react-intl';
import { CoinLogo } from '@trezor/components';
import { Output } from '@wallet-types/sendForm';

import { getTitleForNetwork, getTypeForNetwork } from '@wallet-utils/accountUtils';
import { StateProps, DispatchProps } from './Container';
import { Content, Title, LayoutAccount as Layout } from '@wallet-components';
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

const Send = (props: { intl: InjectedIntl } & StateProps & DispatchProps) => {
    const {
        device,
        sendFormActions,
        send,
        fees,
        fiat,
        sendFormActionsBitcoin,
        sendFormActionsEthereum,
        sendFormActionsRipple,
    } = props;
    const { account, network, discovery, shouldRender } = props.selectedAccount;

    if (!device || !send || !account || !discovery || !network || !fees || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return (
            <Layout>
                <Content loader={loader} exceptionPage={exceptionPage} isLoading />
            </Layout>
        );
    }

    const accountType = getTypeForNetwork(account.accountType, props.intl);

    return (
        <Layout>
            <StyledTitle>
                <StyledCoinLogo size={24} symbol={account.symbol} />
                Send {getTitleForNetwork(network.symbol, props.intl)}
                {accountType ? ` (${accountType})` : ''}
            </StyledTitle>
            {send.outputs.map((output: Output) => (
                <OutputWrapper key={output.id}>
                    <Row>
                        <Address
                            outputId={output.id}
                            address={output.address.value}
                            error={output.address.error}
                            sendFormActions={sendFormActions}
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
                            localCurrency={output.localCurrency.value}
                            sendFormActions={sendFormActions}
                        />
                    </Row>
                </OutputWrapper>
            ))}
            <Row>
                <Fee
                    fees={fees}
                    fee={send.fee}
                    sendFormActions={sendFormActions}
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
                    networkType={account.networkType}
                    symbol={network.symbol}
                    sendFormActions={sendFormActions}
                    sendFormActionsBitcoin={sendFormActionsBitcoin}
                    sendFormActionsEthereum={sendFormActionsEthereum}
                    sendFormActionsRipple={sendFormActionsRipple}
                />
            </Row>
        </Layout>
    );
};

export default Send;
