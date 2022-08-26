import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { fetchTransactionsThunk } from '@suite-common/wallet-core';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { FormattedCryptoAmount, Translation } from '@suite-components';
import { SETTINGS } from '@suite-config';
import { useActions } from '@suite-hooks';
import { ExtendedMessageDescriptor } from '@suite-types';
import { Pagination } from '@wallet-components';
import { Checkbox, Icon, Switch, variables } from '@trezor/components';
import { UtxoSelectionList } from '@wallet-components/UtxoSelectionList';
import { useSendFormContext } from '@wallet-hooks';
import { useBitcoinAmountUnit } from '@wallet-hooks/useBitcoinAmountUnit';
import { TypedFieldError } from '@wallet-types/form';

const Row = styled.div`
    align-items: center;
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const SecondRow = styled(Row)`
    font-size: ${variables.FONT_SIZE.SMALL};
    margin-top: 12px;
`;

const DustRow = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-top: 6px;
`;

const GreyText = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const DustDescriptionRow = styled(GreyText)`
    margin: 6px 0 12px 0;
`;

const StyledSwitch = styled(Switch)`
    margin: 0 14px 0 auto;
`;

const AmountWrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-left: auto;
    text-align: right;
`;

const MissingToInput = styled.div<{ isVisible: boolean }>`
    visibility: ${({ isVisible }) => !isVisible && 'hidden'};
`;

const StyledPagination = styled(Pagination)`
    margin-top: 20px;
`;

const Line = styled.div`
    width: 100%;
    height: 1px;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin: 12px 0 16px 0;
`;

interface Props {
    close: () => void;
}

export const CoinControl = ({ close }: Props) => {
    const [currentPage, setSelectedPage] = useState(1);

    const { fetchTransactions } = useActions({
        fetchTransactions: fetchTransactionsThunk,
    });

    const {
        account,
        allUtxosSelected,
        composedInputs,
        dustUtxos,
        errors,
        getDefaultValue,
        isCoinControlEnabled,
        network,
        outputs,
        selectedUtxos,
        spendableUtxos,
        toggleCheckAllUtxos,
        toggleCoinControl,
    } = useSendFormContext();

    const { areSatsUsed } = useBitcoinAmountUnit(account.symbol);

    const inputs = isCoinControlEnabled ? selectedUtxos : composedInputs;

    const getTotal = (amounts: number[]) =>
        amounts.reduce((previous, current) => previous + current, 0);
    const getFormattedAmount = (amount: number) =>
        formatNetworkAmount(amount.toString(), account.symbol);

    // calculate and format amounts
    const totalInputs = getTotal(inputs.map(input => Number(input.amount)));
    const totalOutputs = getTotal(
        outputs.map((_, i) => Number(getDefaultValue(`outputs[${i}].amount`, ''))),
    );
    const totalOutputsInSats = areSatsUsed ? totalOutputs : totalOutputs * 10 ** network.decimals;
    const missingToInput = totalOutputsInSats - totalInputs;
    const formattedTotal = getFormattedAmount(totalInputs);
    const formattedMissing = getFormattedAmount(missingToInput);
    const isMissingToAmount = missingToInput > 0;
    const isMissingVisible =
        isCoinControlEnabled &&
        (isMissingToAmount ||
            !!errors.outputs?.some(
                error =>
                    ((error?.amount as TypedFieldError)?.message as ExtendedMessageDescriptor)
                        ?.id === 'TR_NOT_ENOUGH_SELECTED',
            ));
    const missingToInputId = isMissingToAmount ? 'TR_MISSING_TO_INPUT' : 'TR_MISSING_TO_FEE';

    // pagination
    const totalItems = account.utxo?.length || 0;
    const utxosPerPage = SETTINGS.TXS_PER_PAGE;
    const showPagination = totalItems > utxosPerPage;
    const lastSpendableUtxoIndex = currentPage * utxosPerPage;
    const spendableUtxosOnPage = spendableUtxos.slice(
        lastSpendableUtxoIndex - utxosPerPage,
        lastSpendableUtxoIndex,
    );
    const lastDustUtxoIndex = currentPage * utxosPerPage - spendableUtxos.length;
    const dustOnPage = dustUtxos.slice(
        lastDustUtxoIndex - utxosPerPage,
        lastDustUtxoIndex > 0 ? lastDustUtxoIndex : 0,
    );

    useEffect(() => {
        const promise = fetchTransactions({
            account,
            page: 2,
            perPage: SETTINGS.TXS_PER_PAGE,
            noLoading: true,
            recursive: true,
        });
        return () => {
            promise.abort();
        };
    }, [account, fetchTransactions]);

    const missingToInputValues = {
        amount: <FormattedCryptoAmount value={formattedMissing} symbol={account.symbol} />,
    };

    return (
        <>
            <Row>
                <Translation id="TR_COIN_CONTROL" />
                <StyledSwitch isChecked={!!isCoinControlEnabled} onChange={toggleCoinControl} />
                <Icon size={24} icon="ARROW_UP" onClick={close} />
            </Row>
            <SecondRow>
                <Checkbox
                    isChecked={allUtxosSelected}
                    isDisabled={!spendableUtxos.length}
                    onClick={toggleCheckAllUtxos}
                />
                <GreyText>
                    <Translation id="TR_SELECTED" values={{ amount: inputs.length }} />
                </GreyText>
                <AmountWrapper>
                    <GreyText>
                        <FormattedCryptoAmount value={formattedTotal} symbol={account.symbol} />
                    </GreyText>
                    <MissingToInput isVisible={isMissingVisible}>
                        <Translation id={missingToInputId} values={missingToInputValues} />
                    </MissingToInput>
                </AmountWrapper>
            </SecondRow>
            <Line />
            {spendableUtxos.length ? (
                <UtxoSelectionList utxos={spendableUtxosOnPage} />
            ) : (
                <Translation id="TR_NO_SPENDABLE_UTXOS" />
            )}
            {!!dustOnPage.length && (
                <>
                    <Line />
                    <DustRow>
                        <Translation id="TR_DUST" />
                    </DustRow>
                    <DustDescriptionRow>
                        <Translation id="TR_DUST_DESCRIPTION" />
                    </DustDescriptionRow>
                    <UtxoSelectionList utxos={dustOnPage} />
                </>
            )}
            {showPagination && (
                <StyledPagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    perPage={utxosPerPage}
                    onPageSelected={setSelectedPage}
                />
            )}
            <Line />
        </>
    );
};
