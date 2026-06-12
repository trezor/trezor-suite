import { useCallback, useMemo } from 'react';

import { CoinControl as SuiteCoinControl } from '@suite/coin-control';
import type {
    CoinControlActions,
    CoinControlRenderers,
    CoinControlViewModel,
} from '@suite/coin-control';
import { useTranslation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { COMPOSE_ERROR_TYPES } from '@suite-common/wallet-constants';
import {
    fetchUtxoTransactionsForAccountThunk,
    selectAccountTransactions,
    useDisplayBaseCurrency,
} from '@suite-common/wallet-core';
import {
    convertAmountUnitsToSubunits,
    formatNetworkAmount,
    getUtxoOutpoint,
} from '@suite-common/wallet-utils';
import { type AccountUtxo } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { Pagination, TransactionTimestamp, UtxoAnonymity } from 'src/components/wallet';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import {
    selectCoinjoinAccountByKey,
    selectCoinjoinClient,
    selectCurrentTargetAnonymity,
} from 'src/reducers/wallet/coinjoinReducer';
import { selectAccountLabelsForSearch } from 'src/selectors/suite/selectAccountLabelsForSearch';
import { type WalletAccountTransaction } from 'src/types/wallet';
import { WabiSabiProtocolErrorCode } from 'src/types/wallet/coinjoin';

type CoinControlProps = {
    close: () => void;
};

type UseCoinjoinUnavailableMessagesParams = {
    accountUtxos?: AccountUtxo[];
    accountKey: string;
};

const useCoinjoinUnavailableMessages = ({
    accountKey,
    accountUtxos,
}: UseCoinjoinUnavailableMessagesParams) => {
    const coinjoinAccount = useSelector(state => selectCoinjoinAccountByKey(state, accountKey));
    const coinjoinClient = useSelector(state => selectCoinjoinClient(state, accountKey));
    const { translationString } = useTranslation();

    return useMemo(() => {
        const messages: CoinControlViewModel['coinjoinUnavailableMessages'] = {};

        if (!coinjoinClient?.allowedInputAmounts) {
            return messages;
        }

        accountUtxos?.forEach(utxo => {
            const imprisonedUtxo = coinjoinAccount?.prison?.[getUtxoOutpoint(utxo)];

            if (imprisonedUtxo?.errorCode === WabiSabiProtocolErrorCode.InputBanned) {
                messages[getUtxoOutpoint(utxo)] = translationString(
                    'TR_UTXO_SHORT_BANNED_IN_COINJOIN',
                );

                return;
            }

            if (imprisonedUtxo?.errorCode === WabiSabiProtocolErrorCode.InputLongBanned) {
                messages[getUtxoOutpoint(utxo)] = translationString(
                    'TR_UTXO_LONG_BANNED_IN_COINJOIN',
                );

                return;
            }

            const amount = new BigNumber(utxo.amount);

            if (amount.lt(coinjoinClient.allowedInputAmounts.min)) {
                messages[getUtxoOutpoint(utxo)] = translationString(
                    'TR_AMOUNT_TOO_SMALL_FOR_COINJOIN',
                );

                return;
            }

            if (amount.gt(coinjoinClient.allowedInputAmounts.max)) {
                messages[getUtxoOutpoint(utxo)] = translationString(
                    'TR_AMOUNT_TOO_BIG_FOR_COINJOIN',
                );
            }
        });

        return messages;
    }, [
        accountUtxos,
        coinjoinAccount?.prison,
        coinjoinClient?.allowedInputAmounts,
        translationString,
    ]);
};

export const CoinControl = ({ close }: CoinControlProps) => {
    const {
        account,
        formState: { errors },
        getDefaultValue,
        network,
        outputs,
        isLoading,
        utxoSelection: {
            allUtxosSelected,
            coinjoinRegisteredUtxos,
            composedInputs,
            dustUtxos,
            isCoinControlEnabled,
            lowAnonymityUtxos,
            selectedUtxos,
            selectUtxoSorting,
            spendableUtxos,
            toggleCheckAllUtxos,
            toggleCoinControl,
            toggleUtxoSelection,
            utxoSorting,
        },
    } = useSendFormContext();
    const { outputLabels } = useSelector(state => selectAccountLabelsForSearch(state, account));
    const targetAnonymity = useSelector(selectCurrentTargetAnonymity);
    const transactions = useSelector(state => selectAccountTransactions(state, account.key));
    const coinjoinUnavailableMessages = useCoinjoinUnavailableMessages({
        accountKey: account.key,
        accountUtxos: account.utxo,
    });
    const dispatch = useDispatch();

    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(account.symbol);
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

    const getTotal = (amounts: number[]) =>
        amounts.reduce((previous, current) => previous + current, 0);
    const getFormattedAmount = (amount: number) =>
        formatNetworkAmount(amount.toString(), account.symbol);

    const inputs = isCoinControlEnabled ? selectedUtxos : composedInputs;
    const totalInputs = getTotal(inputs.map(input => Number(input.amount)));
    const totalOutputs = getTotal(
        outputs.map((_, index) => Number(getDefaultValue(`outputs.${index}.amount`, ''))),
    );
    const totalOutputsInSats = shouldSendInSats
        ? totalOutputs
        : Number(convertAmountUnitsToSubunits(totalOutputs.toString(), network.decimals));
    const missingToInput = totalOutputsInSats - totalInputs;
    const isMissingToAmount = missingToInput > 0;
    const missingAmountTooBig = missingToInput > Number.MAX_SAFE_INTEGER;
    const amountHasError = errors.outputs?.some?.(error => error?.amount);
    const notEnoughFundsSelectedError = !!errors.outputs?.some?.(
        error => error?.amount?.type === COMPOSE_ERROR_TYPES.COIN_CONTROL,
    );
    const isMissingVisible =
        isCoinControlEnabled &&
        !isLoading &&
        !missingAmountTooBig &&
        !(amountHasError && !notEnoughFundsSelectedError) &&
        (isMissingToAmount || notEnoughFundsSelectedError);
    const missingToInputId = isMissingToAmount ? 'TR_MISSING_TO_INPUT' : 'TR_MISSING_TO_FEE';
    const formattedMissing = isMissingVisible ? getFormattedAmount(missingToInput) : '';

    const fetchUtxoTransactions = useCallback(
        () =>
            dispatch(
                fetchUtxoTransactionsForAccountThunk({
                    accountKey: account.key,
                }),
            ),
        [account.key, dispatch],
    );

    const onShowTransactionDetail = useCallback(
        (transaction: WalletAccountTransaction) => {
            dispatch(
                openModal({
                    type: 'transaction-detail',
                    txid: transaction.txid,
                    descriptor: transaction.descriptor,
                    symbol: transaction.symbol,
                    deviceState: transaction.deviceState,
                    flow: 'detail',
                }),
            );
        },
        [dispatch],
    );

    const viewModel: CoinControlViewModel = {
        account,
        allUtxosSelected,
        coinjoinRegisteredUtxos,
        coinjoinUnavailableMessages,
        composedInputs,
        dustUtxos,
        isCoinControlEnabled,
        lowAnonymityUtxos,
        network,
        outputLabels,
        selectedUtxos,
        spendableUtxos,
        summary: {
            inputCount: inputs.length,
            missingAmount: isMissingVisible
                ? {
                      translationId: missingToInputId,
                      value: formattedMissing,
                  }
                : undefined,
            totalInputAmount: getFormattedAmount(totalInputs),
        },
        targetAnonymity,
        transactions,
        utxoSorting,
        utxosPerPage: getTxsPerPage(account.networkType),
    };

    const actions: CoinControlActions = {
        close,
        fetchUtxoTransactions,
        onShowTransactionDetail,
        selectUtxoSorting,
        toggleCheckAllUtxos,
        toggleCoinControl,
        toggleUtxoSelection,
    };

    const renderers: CoinControlRenderers = {
        renderBaseCurrencyValue: ({ amount, symbol }) =>
            shallDisplayBaseCurrency ? <BaseCurrencyValue amount={amount} symbol={symbol} /> : null,
        renderCryptoAmount: ({ symbol, value }) => (
            <FormattedCryptoAmount value={value} symbol={symbol} />
        ),
        renderPagination: props => <Pagination {...props} />,
        renderTransactionTimestamp: ({ transaction }) => (
            <TransactionTimestamp showDate transaction={transaction} />
        ),
        renderUtxoAnonymity: ({ anonymity }) => <UtxoAnonymity anonymity={anonymity} />,
    };

    return <SuiteCoinControl actions={actions} renderers={renderers} viewModel={viewModel} />;
};
