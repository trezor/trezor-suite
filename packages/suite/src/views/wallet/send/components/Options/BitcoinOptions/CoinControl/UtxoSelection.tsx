import { MouseEventHandler } from 'react';
import styled, { css, useTheme } from 'styled-components';

import { formatNetworkAmount, isSameUtxo } from '@suite-common/wallet-utils';
import { Checkbox, Spinner, TextButton, Tooltip } from '@trezor/components';
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
import { borders, spacingsPx, typography } from '@trezor/theme';

const transitionSpeed = '0.16s';

const LabelPart = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
    color: ${({ theme }) => theme.textSubdued};
    overflow: hidden;
`;

const DetailPartVisibleOnHover = styled.div<{ alwaysVisible?: boolean }>`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
    color: ${({ theme }) => theme.textSubdued};

    ${({ alwaysVisible }) =>
        !alwaysVisible &&
        css`
            opacity: 0;
            transition: opacity ${transitionSpeed};
        `};
`;

const StyledCheckbox = styled(Checkbox)<{ isChecked: boolean; $isGrey: boolean }>`
    margin-top: ${spacingsPx.xxxs};
    margin-right: ${spacingsPx.xs};
`;

const Wrapper = styled.div<{ isDisabled: boolean }>`
    align-items: flex-start;
    border-radius: ${borders.radii.xs};
    display: flex;
    margin: 1px -${spacingsPx.sm};
    padding: ${spacingsPx.sm} ${spacingsPx.sm} ${spacingsPx.xs};
    transition: background ${transitionSpeed};
    cursor: pointer;

    ${({ isDisabled }) =>
        isDisabled &&
        css`
            color: ${({ theme }) => theme.textSubdued};
            cursor: default;
        `};

    :hover,
    :focus-within {
        ${({ isDisabled }) =>
            !isDisabled &&
            css`
                background: ${({ theme }) => theme.backgroundSurfaceElevation2};

                ${StyledCheckbox} > :first-child {
                    border-color: ${({ theme }) => theme.borderFocus};
                }
            `};

        ${DetailPartVisibleOnHover} {
            opacity: 1;
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
    gap: ${spacingsPx.xs};
`;

const BottomRow = styled(Row)`
    margin-top: 6px;
    min-height: 24px;
`;

const Address = styled.div`
    overflow: hidden;
    font-variant-numeric: tabular-nums slashed-zero;
    text-overflow: ellipsis;
`;

const StyledCryptoAmount = styled(FormattedCryptoAmount)`
    margin-left: auto;
    padding-left: ${spacingsPx.xxs};
    white-space: nowrap;
`;

const TransactionDetailButton = styled(TextButton)`
    color: ${({ theme }) => theme.textSubdued};

    :hover,
    :focus {
        color: ${({ theme }) => theme.textOnTertiary};
    }
`;

const StyledFluidSpinner = styled(Spinner)`
    margin-right: ${spacingsPx.xs};
`;

const StyledFiatValue = styled(FiatValue)`
    margin-left: auto;
    padding-left: 4px;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
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
                            <span>•</span>
                            <UtxoAnonymity anonymity={anonymity} />
                        </>
                    )}

                    {isLabelingPossible && (
                        <LabelPart>
                            <span>•</span>
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
                        </LabelPart>
                    )}

                    {transaction && (
                        <DetailPartVisibleOnHover>
                            <span>•</span>
                            <TransactionDetailButton size="small" onClick={showTransactionDetail}>
                                <Translation id="TR_DETAIL" />
                            </TransactionDetailButton>
                        </DetailPartVisibleOnHover>
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
