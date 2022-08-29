import React, { useState } from 'react';
import styled, { css } from 'styled-components';

import { FormattedCryptoAmount, MetadataLabeling, Translation } from '@suite-components';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { useActions, useSelector } from '@suite-hooks';
import { useTheme, Checkbox, FluidSpinner, variables } from '@trezor/components';
import type { AccountUtxo } from '@trezor/connect';
import { TransactionTimestamp } from '@wallet-components';
import { useSendFormContext } from '@wallet-hooks';
import { WalletAccountTransaction } from '@wallet-types';

const Wrapper = styled.div`
    align-items: flex-start;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    margin: 0 -12px;
    padding: 8px 12px;

    :hover {
        background: ${({ theme }) => theme.BG_LIGHT_GREY};
    }
`;

const Body = styled.div`
    flex-grow: 1;
    /* prevent overflow if contents (e.g. label) are too long */
    min-width: 0;
`;

const Row = styled.div`
    align-items: center;
    display: flex;
`;

const TopRow = styled(Row)`
    justify-content: space-between;
    margin-bottom: 4px;
`;

const IconWrapper = styled.div`
    margin-right: 8px;
`;

const StyledCheckbox = styled(Checkbox)<{ isChecked: boolean; $isGrey: boolean }>`
    margin-top: 4px;
    ${({ isChecked, $isGrey, theme }) =>
        isChecked &&
        $isGrey &&
        css`
            > div:first-child {
                background: ${theme.TYPE_LIGHTER_GREY};
            }

            :not(:hover) > div:first-child {
                border: 2px solid ${theme.TYPE_LIGHTER_GREY};
            }
        `};
`;

const StyledCryptoAmount = styled(FormattedCryptoAmount)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const TranslationWrapper = styled.span`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 14px;
    margin-right: 14px;
`;

interface Props {
    isChecked: boolean;
    transaction?: WalletAccountTransaction;
    utxo: AccountUtxo;
}

export const UtxoSelection = ({ isChecked, transaction, utxo }: Props) => {
    const device = useSelector(state => state.suite.device);
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });

    const { account, network, selectedUtxos, toggleUtxoSelection } = useSendFormContext();
    const theme = useTheme();

    const isChangeAddress = utxo.path.split('/')[4] === '1';
    const amountInBtc = (Number(utxo.amount) / 10 ** network.decimals).toString();
    const outputLabel = account.metadata.outputLabels?.[utxo.txid]?.[utxo.vout];
    const isLabelingPossible = device?.metadata.status === 'enabled' || device?.connected;

    const handleCheckbox = () => toggleUtxoSelection(utxo);
    const handleMouseEnter = () => setLabelVisible(true);
    const handleMouseLeave = () => setLabelVisible(false);

    return (
        <Wrapper
            onClick={handleCheckbox}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <StyledCheckbox
                $isGrey={!selectedUtxos.length}
                isChecked={isChecked}
                onClick={handleCheckbox}
            />
            <Body>
                <TopRow>
                    {utxo.address}
                    <StyledCryptoAmount
                        value={formatNetworkAmount(utxo.amount, account.symbol)}
                        symbol={account.symbol}
                    />
                </TopRow>
                <Row>
                    {transaction ? (
                        <TransactionTimestamp showDate transaction={transaction} />
                    ) : (
                        <IconWrapper>
                            <FluidSpinner color={theme.TYPE_LIGHT_GREY} size={14} />
                        </IconWrapper>
                    )}
                    {isLabelingPossible && (
                        <VisibleOnHover alwaysVisible={!!outputLabel}>
                            <Dot />
                            <MetadataLabeling
                                visible
                                payload={{
                                    type: 'outputLabel',
                                    accountKey: account.key,
                                    txid: utxo.txid,
                                    outputIndex: utxo.vout,
                                    defaultValue: `${utxo.txid}-${utxo.vout}`,
                                    value: outputLabel,
                                }}
                            />
                        </VisibleOnHover>
                    )}
                    {transaction && (
                        <VisibleOnHover>
                            <Dot />
                            <TransactionDetail onClick={showTransactionDetail}>
                                <Translation id="TR_DETAIL" />
                            </TransactionDetail>
                        </VisibleOnHover>
                    )}
                    <StyledFiatValue amount={amountInBtc} symbol={network.symbol} />
                </BottomRow>
            </Body>
        </Wrapper>
    );
};
