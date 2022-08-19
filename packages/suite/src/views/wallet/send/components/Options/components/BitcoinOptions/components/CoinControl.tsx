import React, { useState } from 'react';
import styled from 'styled-components';

import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { FormattedCryptoAmount, Translation } from '@suite-components';
import { Checkbox, Icon, Switch, variables } from '@trezor/components';
import { SETTINGS } from '@suite-config';
import type { AccountUtxo } from '@trezor/connect';
import { Pagination } from '@wallet-components';
import { UtxoSelectionList } from '@wallet-components/UtxoSelectionList';
import { useSendFormContext } from '@wallet-hooks';

const Row = styled.div`
    align-items: center;
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const SecondRow = styled(Row)`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    margin-top: 12px;
`;

const DustRow = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-top: 6px;
`;

const DustDescriptionRow = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin: 6px 0 12px 0;
`;

const StyledSwitch = styled(Switch)`
    margin: 0 12px 0 auto;
`;

const StyledCryptoAmount = styled(FormattedCryptoAmount)`
    margin-left: auto;
`;

const Line = styled.div`
    width: 100%;
    height: 1px;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin: 16px 0;
`;

interface Props {
    close: () => void;
}

export const CoinControl = ({ close }: Props) => {
    const [currentPage, setSelectedPage] = useState(1);

    const { account, composedLevels, composeTransaction, feeInfo, selectedUtxos, setValue, watch } =
        useSendFormContext();

    // separate dust UTXOs
    const [spendableUtxos, dustUtxos]: [AccountUtxo[], AccountUtxo[]] = account.utxo
        ? account.utxo.reduce(
              ([previousSpendable, previousDust]: [AccountUtxo[], AccountUtxo[]], current) =>
                  feeInfo.dustLimit && parseInt(current.amount, 10) >= feeInfo.dustLimit
                      ? [[...previousSpendable, current], previousDust]
                      : [previousSpendable, [...previousDust, current]],
              [[], []],
          )
        : [[], []];

    const selectedFee = watch('selectedFee');
    const composedLevel = composedLevels?.[selectedFee || 'normal'];
    const composedInputs = composedLevel?.type === 'final' ? composedLevel.transaction.inputs : [];
    const inputs = composedInputs.length ? composedInputs : selectedUtxos;
    const allSelected = !!selectedUtxos.length && selectedUtxos.length === spendableUtxos.length;

    // calculate total
    // TypeScript does not allow Array.prototype.reduce here (https://github.com/microsoft/TypeScript/issues/36390)
    let total = 0;
    inputs.forEach(input => {
        if ('amount' in input) {
            total += Number(input.amount);
        }
    });
    const formattedTotal = formatNetworkAmount(total.toString(), account.symbol);

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

    const handleSwitch = () => {
        setValue(
            'selectedUtxos',
            selectedUtxos.length
                ? []
                : account.utxo?.filter(utxo =>
                      composedInputs.some(
                          input => input.prev_hash === utxo.txid && input.prev_index === utxo.vout,
                      ),
                  ),
        );
        composeTransaction();
    };
    const handleCheckbox = () => {
        setValue('selectedUtxos', allSelected ? [] : spendableUtxos);
        composeTransaction();
    };

    return (
        <>
            <Row>
                <Translation id="TR_COIN_CONTROL" />
                <StyledSwitch
                    isChecked={!!selectedUtxos.length}
                    isDisabled={!inputs.length}
                    onChange={handleSwitch}
                />
                <Icon size={20} icon="CROSS" onClick={close} />
            </Row>
            <SecondRow>
                <Checkbox
                    isChecked={allSelected}
                    isDisabled={!spendableUtxos.length}
                    onClick={handleCheckbox}
                />
                <Translation id="TR_SELECTED" values={{ amount: inputs.length }} />
                {!!total && <StyledCryptoAmount value={formattedTotal} symbol={account.symbol} />}
            </SecondRow>
            <Line />
            {spendableUtxos.length ? (
                <UtxoSelectionList utxos={spendableUtxosOnPage} composedInputs={composedInputs} />
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
                    <UtxoSelectionList utxos={dustOnPage} composedInputs={composedInputs} />
                </>
            )}
            {showPagination && (
                <Pagination
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
