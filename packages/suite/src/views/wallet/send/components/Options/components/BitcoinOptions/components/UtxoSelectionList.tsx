import React from 'react';
import styled from 'styled-components';

import { formatNetworkAmount, getAccountTransactions } from '@suite-common/wallet-utils';
import { FormattedCryptoAmount, Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';
import { Checkbox, Icon, Switch, variables } from '@trezor/components';
import { UtxoSelection } from '@wallet-components/UtxoSelection';
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

export const UtxoSelectionList = ({ close }: Props) => {
    const { transactions } = useSelector(state => ({
        transactions: state.wallet.transactions,
    }));
    const { account, composedLevels, composeTransaction, selectedUtxos, setValue, watch } =
        useSendFormContext();

    const selectedFee = watch('selectedFee');
    const composedLevel = composedLevels?.[selectedFee || 'normal'];
    const composedInputs = composedLevel?.type === 'final' ? composedLevel.transaction.inputs : [];
    const inputs = composedInputs.length ? composedInputs : selectedUtxos;
    const allSelected = selectedUtxos.length === account.utxo?.length;
    const accountTransactions = getAccountTransactions(account.key, transactions.transactions);

    // TypeScript does not allow Array.prototype.reduce here (https://github.com/microsoft/TypeScript/issues/36390)
    let total = 0;
    inputs.forEach(input => {
        if ('amount' in input) {
            total += Number(input.amount);
        }
    });
    const formattedTotal = formatNetworkAmount(total.toString(), account.symbol);

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
        setValue('selectedUtxos', allSelected ? [] : account.utxo);
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
                <Checkbox isChecked={allSelected} onClick={handleCheckbox} />
                <Translation id="TR_SELECTED" values={{ amount: inputs.length }} />
                {!!total && <StyledCryptoAmount value={formattedTotal} symbol={account.symbol} />}
            </SecondRow>
            <Line />
            {account.utxo?.map(utxo => (
                <UtxoSelection
                    key={`${utxo.txid}-${utxo.vout}`}
                    isChecked={
                        selectedUtxos.length
                            ? selectedUtxos.some(u => u.txid === utxo.txid && u.vout === utxo.vout)
                            : composedInputs.some(
                                  u => u.prev_hash === utxo.txid && u.prev_index === utxo.vout,
                              )
                    }
                    transaction={accountTransactions.find(
                        transaction => transaction.txid === utxo.txid,
                    )}
                    utxo={utxo}
                />
            ))}
            <Line />
        </>
    );
};
