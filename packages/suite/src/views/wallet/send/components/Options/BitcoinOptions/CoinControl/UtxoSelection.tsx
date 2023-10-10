import { MouseEventHandler } from 'react';

import styled, { css, useTheme } from 'styled-components';
import { darken } from 'polished';

import { formatNetworkAmount, isSameUtxo } from '@suite-common/wallet-utils';
import { Checkbox, Spinner, Tooltip, variables } from '@trezor/components';
import type { AccountUtxo } from '@trezor/connect';

import { openModal } from 'src/actions/suite/modalActions';
import {
    FiatValue,
    FormattedCryptoAmount,
    MetadataLabeling,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { TransactionTimestamp, UtxoAnonymity } from 'src/components/wallet';
import { useSendFormContext } from 'src/hooks/wallet';
import { useCoinjoinUnavailableUtxos } from 'src/hooks/wallet/form/useCoinjoinUnavailableUtxos';
import { WalletAccountTransaction } from 'src/types/wallet';
import { UtxoTag } from './UtxoTag';
import {
    selectIsLabelingInitPossible,
    selectLabelingDataForSelectedAccount,
} from 'src/reducers/suite/metadataReducer';

const VisibleOnHover = styled.div<{ alwaysVisible?: boolean }>`
    display: ${({ alwaysVisible }) => (alwaysVisible ? 'contents' : 'none')};
`;

const StyledCheckbox = styled(Checkbox)<{ isChecked: boolean; $isGrey: boolean }>`
    margin-top: 2px;
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

const Wrapper = styled.div<{ isDisabled: boolean }>`
    align-items: flex-start;
    border-radius: 8px;
    display: flex;
    margin: 1px -12px;
    padding: 12px 12px 8px;
    transition: background 0.25s ease-out;
    cursor: pointer;
    ${({ isDisabled }) =>
        isDisabled &&
        css`
            color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
            cursor: default;
        `};

    &:hover {
        ${({ isDisabled }) =>
            !isDisabled &&
            css`
                background: ${({ theme }) => theme.BG_GREY};
                ${StyledCheckbox} > :first-child {
                    border-color: ${({ theme }) =>
                        darken(theme.HOVER_DARKEN_FILTER, theme.STROKE_GREY)};
                }
            `};
        ${VisibleOnHover} {
            display: contents;
        }
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
    gap: 6px;
`;

const BottomRow = styled(Row)`
    margin-top: 6px;
    min-height: 24px;
`;

const Dot = styled.div`
    border-radius: 50%;
    background: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    height: 3px;
    width: 3px;
`;

const Address = styled.div`
    overflow: hidden;
    font-variant-numeric: tabular-nums slashed-zero;
    text-overflow: ellipsis;
`;

const StyledCryptoAmount = styled(FormattedCryptoAmount)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-left: auto;
    padding-left: 4px;
    white-space: nowrap;
`;

const TransactionDetail = styled.button`
    background: none;
    border: none;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    cursor: pointer;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding: 0;
    text-decoration: underline;

    &:hover {
        color: ${({ theme }) => theme.TYPE_DARK_GREY};
    }
`;

const StyledFluidSpinner = styled(Spinner)`
    margin-right: 8px;
`;

const StyledFiatValue = styled(FiatValue)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-left: auto;
    padding-left: 4px;
`;

interface UtxoSelectionProps {
    transaction?: WalletAccountTransaction;
    utxo: AccountUtxo;
}

export const UtxoSelection = ({ transaction, utxo }: UtxoSelectionProps) => {
    const {
        account,
        network,
        utxoSelection: {
            selectedUtxos,
            coinjoinRegisteredUtxos,
            composedInputs,
            toggleUtxoSelection,
            isCoinControlEnabled,
        },
    } = useSendFormContext();
    // selecting metadata from store rather than send form context which does not update on metadata change
    const { outputLabels } = useSelector(selectLabelingDataForSelectedAccount);

    const dispatch = useDispatch();

    const theme = useTheme();

    const coinjoinUnavailableMessage = useCoinjoinUnavailableUtxos({ account, utxo });
    const isPendingTransaction = utxo.confirmations === 0;
    const isChangeAddress = utxo.path.split('/').at(-2) === '1'; // change address always has a 1 on the penultimate level of the derivation path
    const outputLabel = outputLabels?.[utxo.txid]?.[utxo.vout];

    const isLabelingPossible = useSelector(selectIsLabelingInitPossible);
    const anonymity = account.addresses?.anonymitySet?.[utxo.address];

    const isChecked = isCoinControlEnabled
        ? selectedUtxos.some(selected => isSameUtxo(selected, utxo))
        : composedInputs.some(u => u.prev_hash === utxo.txid && u.prev_index === utxo.vout);
    const isDisabled = coinjoinRegisteredUtxos.includes(utxo);
    const utxoTagIconColor = isDisabled ? theme.TYPE_LIGHT_GREY : theme.TYPE_DARK_GREY;

    const handleCheckbox = () => toggleUtxoSelection(utxo);
    const showTransactionDetail: MouseEventHandler = e => {
        e.stopPropagation(); // do not trigger the checkbox
        if (transaction) {
            dispatch(openModal({ type: 'transaction-detail', tx: transaction }));
        }
    };

    return (
        <Wrapper isDisabled={isDisabled} onClick={isDisabled ? undefined : handleCheckbox}>
            <Tooltip content={isDisabled && <Translation id="TR_UTXO_REGISTERED_IN_COINJOIN" />}>
                <StyledCheckbox
                    $isGrey={!selectedUtxos.length}
                    isChecked={isChecked}
                    isDisabled={isDisabled}
                    onClick={handleCheckbox}
                />
            </Tooltip>
            <Body>
                <Row>
                    {isPendingTransaction && (
                        <UtxoTag
                            tooltipMessage={<Translation id="TR_IN_PENDING_TRANSACTION" />}
                            icon="CLOCK"
                            iconColor={utxoTagIconColor}
                        />
                    )}
                    {coinjoinUnavailableMessage && (
                        <UtxoTag
                            tooltipMessage={coinjoinUnavailableMessage}
                            icon="BLOCKED"
                            iconColor={utxoTagIconColor}
                        />
                    )}
                    {isChangeAddress && (
                        <UtxoTag
                            tooltipMessage={<Translation id="TR_CHANGE_ADDRESS_TOOLTIP" />}
                            icon="CHANGE_ADDRESS"
                            iconColor={utxoTagIconColor}
                        />
                    )}
                    <Address>{utxo.address}</Address>
                    <StyledCryptoAmount
                        value={formatNetworkAmount(utxo.amount, account.symbol)}
                        symbol={account.symbol}
                    />
                </Row>
                <BottomRow>
                    {transaction ? (
                        <TransactionTimestamp showDate transaction={transaction} />
                    ) : (
                        <Tooltip
                            interactive={false}
                            cursor="pointer"
                            content={<Translation id="TR_LOADING_TRANSACTION_DETAILS" />}
                        >
                            <StyledFluidSpinner size={14} />
                        </Tooltip>
                    )}
                    {anonymity && (
                        <>
                            <Dot />
                            <UtxoAnonymity anonymity={anonymity} />
                        </>
                    )}
                    {isLabelingPossible && (
                        <VisibleOnHover alwaysVisible={!!outputLabel}>
                            <Dot />
                            <MetadataLabeling
                                visible
                                payload={{
                                    type: 'outputLabel',
                                    entityKey: account.key,
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
                    <StyledFiatValue
                        amount={formatNetworkAmount(utxo.amount, account.symbol, false)}
                        symbol={network.symbol}
                    />
                </BottomRow>
            </Body>
        </Wrapper>
    );
};
