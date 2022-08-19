import * as React from 'react';
import styled, { css } from 'styled-components';

import * as modalActions from '@suite-actions/modalActions';
import { FormattedCryptoAmount, MetadataLabeling, Translation } from '@suite-components';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { useActions } from '@suite-hooks';
import { useTheme, Checkbox, FluidSpinner, variables } from '@trezor/components';
import type { AccountUtxo } from '@trezor/connect';
import { TransactionTimestamp } from '@wallet-components/TransactionItem/components/TransactionTimestamp';
import { useSendFormContext } from '@wallet-hooks';
import { WalletAccountTransaction } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    align-items: flex-start;
    padding: 8px 0px;
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
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
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

const Dot = styled.div`
    border-radius: 50%;
    background: ${props => props.theme.TYPE_LIGHT_GREY};
    height: 3px;
    margin-right: 8px;
    width: 3px;
`;

const TranslationWrapper = styled.span`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface Props {
    isChecked: boolean;
    transaction?: WalletAccountTransaction;
    utxo: AccountUtxo;
}

export const UtxoSelection = ({ isChecked, transaction, utxo }: Props) => {
    const { account, selectedUtxos, toggleUtxoSelection } = useSendFormContext();

    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });

    const theme = useTheme();

    const isChangeAddress = utxo.path.split('/')[4] === '1';

    const handleCheckbox = () => toggleUtxoSelection(utxo);

    return (
        <Wrapper>
            <StyledCheckbox
                $isGrey={!selectedUtxos.length}
                isChecked={isChecked}
                onClick={handleCheckbox}
            />
            <Body>
                <TopRow>
                    {utxo.address}
                    <FormattedCryptoAmount
                        value={formatNetworkAmount(utxo.amount, account.symbol)}
                        symbol={account.symbol}
                    />
                </TopRow>
                <Row>
                    {transaction ? (
                        <TransactionTimestamp
                            showDate
                            transaction={transaction}
                            onClick={() =>
                                openModal({
                                    type: 'transaction-detail',
                                    tx: transaction,
                                })
                            }
                        />
                    ) : (
                        <IconWrapper>
                            <FluidSpinner color={theme.TYPE_LIGHT_GREY} size={14} />
                        </IconWrapper>
                    )}
                    <Dot />
                    <MetadataLabeling
                        visible={!isChangeAddress}
                        defaultVisibleValue={
                            isChangeAddress ? (
                                <TranslationWrapper>
                                    <Translation id="TR_CHANGE_ADDRESS" />
                                </TranslationWrapper>
                            ) : null
                        }
                        payload={{
                            type: 'outputLabel',
                            accountKey: account.key,
                            txid: utxo.txid,
                            outputIndex: utxo.vout,
                            defaultValue: `${utxo.txid}-${utxo.vout}`,
                            value: account.metadata.outputLabels?.[utxo.txid]?.[utxo.vout],
                        }}
                    />
                </Row>
            </Body>
        </Wrapper>
    );
};
