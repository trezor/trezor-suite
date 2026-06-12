import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { filterAndCategorizeUtxos } from '@suite-common/transaction-search';
import {
    Banner,
    Card,
    Checkbox,
    Column,
    Divider,
    Icon,
    Paragraph,
    Row,
    Switch,
    Text,
} from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

import { UtxoSearch } from './UtxoSearch';
import { UtxoSelectionList } from './UtxoSelectionList/UtxoSelectionList';
import { UtxoSortingSelect } from './UtxoSortingSelect';
import {
    type CoinControlActions,
    type CoinControlRenderers,
    type CoinControlViewModel,
} from './types';

const Empty = styled.div`
    border-bottom: 1px solid ${({ theme }) => theme.borderNeutral};
    margin-bottom: ${spacingsPx.sm};
    padding: ${spacingsPx.sm} 0;
`;

type CoinControlProps = {
    actions: CoinControlActions;
    renderers: CoinControlRenderers;
    viewModel: CoinControlViewModel;
};

export const CoinControl = ({ actions, renderers, viewModel }: CoinControlProps) => {
    const [currentPage, setSelectedPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const {
        account,
        allUtxosSelected,
        coinjoinRegisteredUtxos,
        coinjoinUnavailableMessages,
        composedInputs,
        dustUtxos,
        isCoinControlEnabled,
        lowAnonymityUtxos,
        outputLabels,
        selectedUtxos,
        spendableUtxos,
        summary,
        targetAnonymity,
        transactions,
        utxoSorting,
        utxosPerPage,
    } = viewModel;

    const {
        close,
        fetchUtxoTransactions,
        onShowTransactionDetail,
        selectUtxoSorting,
        toggleCheckAllUtxos,
        toggleCoinControl,
        toggleUtxoSelection,
    } = actions;

    const { renderCryptoAmount, renderPagination } = renderers;

    const { filteredUtxos, filteredSpendableUtxos, filteredLowAnonymityUtxos, filteredDustUtxos } =
        filterAndCategorizeUtxos({
            searchQuery,
            utxos: account.utxo || [],
            spendableUtxos,
            lowAnonymityUtxos,
            dustUtxos,
            outputLabels,
        });

    const totalItems = filteredUtxos.length;
    const showPagination = totalItems > utxosPerPage;

    let previousItemsLength = 0;
    const paginatedCategories = [
        filteredSpendableUtxos,
        filteredLowAnonymityUtxos,
        filteredDustUtxos,
    ].map(utxoCategory => {
        const lastIndexOnPage = currentPage * utxosPerPage - previousItemsLength;
        previousItemsLength += utxoCategory.length;

        return utxoCategory.slice(
            Math.max(0, lastIndexOnPage - utxosPerPage),
            Math.max(0, lastIndexOnPage),
        );
    });
    const spendableUtxosOnPage = paginatedCategories[0] ?? [];
    const lowAnonymityUtxosOnPage = paginatedCategories[1] ?? [];
    const dustUtxosOnPage = paginatedCategories[2] ?? [];
    const isCoinjoinAccount = account.accountType === 'coinjoin';
    const hasEligibleUtxos = spendableUtxos.length + lowAnonymityUtxos.length > 0;

    useEffect(() => {
        const promise = fetchUtxoTransactions();

        return () => {
            promise.abort();
        };
    }, [fetchUtxoTransactions]);

    const missingToInputValues = {
        amount: summary.missingAmount
            ? renderCryptoAmount({
                  value: summary.missingAmount.value,
                  symbol: account.symbol,
              })
            : null,
    };

    const handleAllUtxosSelected = () => {
        setSearchQuery('');
        setSelectedPage(1);
        toggleCheckAllUtxos();
    };

    return (
        <Card paddingType="large">
            <Column gap={16}>
                <Row justifyContent="space-between">
                    <Translation id="TR_COIN_CONTROL" />
                    <Row gap={spacings.md}>
                        <Switch isChecked={!!isCoinControlEnabled} onChange={toggleCoinControl} />
                        <Icon size={24} name="caretUp" onClick={close} />
                    </Row>
                </Row>

                <Row justifyContent="space-between" margin={{ top: 24 }}>
                    <Checkbox
                        isChecked={allUtxosSelected}
                        isDisabled={!hasEligibleUtxos}
                        onChange={handleAllUtxosSelected}
                    >
                        <Text intent="neutral" priority="secondary">
                            <Translation id="TR_SELECTED" values={{ amount: summary.inputCount }} />
                        </Text>
                    </Checkbox>

                    <Text intent="neutral" priority="secondary">
                        {renderCryptoAmount({
                            value: summary.totalInputAmount,
                            symbol: account.symbol,
                        })}
                    </Text>
                </Row>

                {summary.missingAmount && (
                    <Banner
                        icon
                        description={
                            <Paragraph>
                                <Translation
                                    id={summary.missingAmount.translationId}
                                    values={missingToInputValues}
                                />
                            </Paragraph>
                        }
                    />
                )}

                <Divider margin={0} />

                {hasEligibleUtxos && (
                    <Row gap={12}>
                        <UtxoSearch
                            searchQuery={searchQuery}
                            setSearch={setSearchQuery}
                            setSelectedPage={setSelectedPage}
                        />
                        <UtxoSortingSelect
                            selectUtxoSorting={selectUtxoSorting}
                            utxoSorting={utxoSorting}
                        />
                    </Row>
                )}
                {!!spendableUtxosOnPage.length && (
                    <UtxoSelectionList
                        account={account}
                        coinjoinRegisteredUtxos={coinjoinRegisteredUtxos}
                        coinjoinUnavailableMessages={coinjoinUnavailableMessages}
                        composedInputs={composedInputs}
                        description={
                            <Translation id="TR_PRIVATE_DESCRIPTION" values={{ targetAnonymity }} />
                        }
                        heading={<Translation id="TR_PRIVATE" />}
                        icon="shieldCheck"
                        iconIntent="brand"
                        isCoinControlEnabled={isCoinControlEnabled}
                        onShowTransactionDetail={onShowTransactionDetail}
                        renderers={renderers}
                        selectedUtxos={selectedUtxos}
                        toggleUtxoSelection={toggleUtxoSelection}
                        transactions={transactions}
                        utxos={spendableUtxosOnPage}
                        withHeader={isCoinjoinAccount}
                    />
                )}
                {!!lowAnonymityUtxosOnPage.length && (
                    <UtxoSelectionList
                        account={account}
                        coinjoinRegisteredUtxos={coinjoinRegisteredUtxos}
                        coinjoinUnavailableMessages={coinjoinUnavailableMessages}
                        composedInputs={composedInputs}
                        description={
                            <Translation
                                id="TR_NOT_PRIVATE_DESCRIPTION"
                                values={{ targetAnonymity }}
                            />
                        }
                        heading={<Translation id="TR_NOT_PRIVATE" />}
                        icon="shieldWarning"
                        iconIntent="warning"
                        isCoinControlEnabled={isCoinControlEnabled}
                        onShowTransactionDetail={onShowTransactionDetail}
                        renderers={renderers}
                        selectedUtxos={selectedUtxos}
                        toggleUtxoSelection={toggleUtxoSelection}
                        transactions={transactions}
                        utxos={lowAnonymityUtxosOnPage}
                        withHeader
                    />
                )}
                {!hasEligibleUtxos && (
                    <Empty>
                        <Translation id="TR_NO_SPENDABLE_UTXOS" />
                    </Empty>
                )}
                {!!dustUtxosOnPage.length && (
                    <UtxoSelectionList
                        account={account}
                        coinjoinRegisteredUtxos={coinjoinRegisteredUtxos}
                        coinjoinUnavailableMessages={coinjoinUnavailableMessages}
                        composedInputs={composedInputs}
                        description={<Translation id="TR_DUST_DESCRIPTION" />}
                        heading={<Translation id="TR_DUST" />}
                        icon="info"
                        iconIntent="neutral"
                        isCoinControlEnabled={isCoinControlEnabled}
                        onShowTransactionDetail={onShowTransactionDetail}
                        renderers={renderers}
                        selectedUtxos={selectedUtxos}
                        toggleUtxoSelection={toggleUtxoSelection}
                        transactions={transactions}
                        utxos={dustUtxosOnPage}
                        withHeader
                    />
                )}
                {showPagination && (
                    <>
                        {renderPagination({
                            currentPage,
                            onPageSelected: setSelectedPage,
                            perPage: utxosPerPage,
                            totalItems,
                        })}
                    </>
                )}
            </Column>
        </Card>
    );
};
