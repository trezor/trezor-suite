import { useEffect, useState } from 'react';

import styled, { useTheme } from 'styled-components';

import { COMPOSE_ERROR_TYPES } from '@suite-common/wallet-constants';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { amountToSmallestUnit, formatNetworkAmount } from '@suite-common/wallet-utils';
import { Card, Checkbox, Column, Icon, Row, Switch, Text } from '@trezor/components';
import { spacings, spacingsPx } from '@trezor/theme';

import { FormattedCryptoAmount, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Pagination } from 'src/components/wallet';
import { useSendFormContext } from 'src/hooks/wallet';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { selectCurrentTargetAnonymity } from 'src/reducers/wallet/coinjoinReducer';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { filterAndCategorizeUtxos } from 'src/utils/wallet/filterAndCategorizeUtxosUtils';

import { UtxoSortingSelect } from './UtxoSortingSelect';
import { UtxoSelectionList } from './UtxoSelectionList/UtxoSelectionList';
import { UtxoSearch } from './UtxoSearch';

const Header = styled.header`
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation1};
    padding-bottom: ${spacingsPx.sm};
`;

const MissingToInput = styled.div<{ $isVisible: boolean }>`
    /* using visibility rather than display to prevent line height change */
    visibility: ${({ $isVisible }) => !$isVisible && 'hidden'};
`;

const Empty = styled.div`
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation1};
    margin-bottom: ${spacingsPx.sm};
    padding: ${spacingsPx.sm} 0;
`;

const StyledPagination = styled(Pagination)`
    margin: ${spacingsPx.lg} 0;
`;

type CoinControlProps = {
    close: () => void;
};

export const CoinControl = ({ close }: CoinControlProps) => {
    const [currentPage, setSelectedPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const { outputLabels } = useSelector(selectLabelingDataForSelectedAccount);
    const targetAnonymity = useSelector(selectCurrentTargetAnonymity);
    const dispatch = useDispatch();

    const {
        account,
        formState: { errors },
        getDefaultValue,
        network,
        outputs,
        isLoading,
        utxoSelection: {
            allUtxosSelected,
            composedInputs,
            dustUtxos,
            isCoinControlEnabled,
            lowAnonymityUtxos,
            selectedUtxos,
            spendableUtxos,
            toggleCheckAllUtxos,
            toggleCoinControl,
        },
    } = useSendFormContext();

    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

    const theme = useTheme();

    const getTotal = (amounts: number[]) =>
        amounts.reduce((previous, current) => previous + current, 0);
    const getFormattedAmount = (amount: number) =>
        formatNetworkAmount(amount.toString(), account.symbol);

    // calculate and format amounts
    const inputs = isCoinControlEnabled ? selectedUtxos : composedInputs;
    const totalInputs = getTotal(inputs.map(input => Number(input.amount)));
    const totalOutputs = getTotal(
        outputs.map((_, i) => Number(getDefaultValue(`outputs.${i}.amount`, ''))),
    );
    const totalOutputsInSats = shouldSendInSats
        ? totalOutputs
        : Number(amountToSmallestUnit(totalOutputs.toString(), network.decimals));
    const missingToInput = totalOutputsInSats - totalInputs;
    const isMissingToAmount = missingToInput > 0; // relevant when the amount field is not validated, e.g. there is an error in the address
    const missingAmountTooBig = missingToInput > Number.MAX_SAFE_INTEGER;
    const amountHasError = errors.outputs?.some?.(error => error?.amount); // relevant when input is a number, but there is an error, e.g. decimals in sats
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
    const formattedTotal = getFormattedAmount(totalInputs);
    const formattedMissing = isMissingVisible ? getFormattedAmount(missingToInput) : ''; // set to empty string when hidden to avoid affecting the layout

    // Filter UTXOs based on searchQuery
    const { filteredUtxos, filteredSpendableUtxos, filteredLowAnonymityUtxos, filteredDustUtxos } =
        filterAndCategorizeUtxos({
            searchQuery,
            utxos: account.utxo || [],
            spendableUtxos,
            lowAnonymityUtxos,
            dustUtxos,
            outputLabels,
        });

    // pagination
    const totalItems = filteredUtxos.length;
    const utxosPerPage = getTxsPerPage(account.networkType);
    const showPagination = totalItems > utxosPerPage;

    // UTXOs and categories displayed on page
    let previousItemsLength = 0;
    const [spendableUtxosOnPage, lowAnonymityUtxosOnPage, dustUtxosOnPage] = [
        filteredSpendableUtxos,
        filteredLowAnonymityUtxos,
        filteredDustUtxos,
    ].map(utxoCategory => {
        const lastIndexOnPage = currentPage * utxosPerPage - previousItemsLength;
        previousItemsLength += utxoCategory.length;

        // avoid negative values which may cause unintended results
        return utxoCategory.slice(
            Math.max(0, lastIndexOnPage - utxosPerPage),
            Math.max(0, lastIndexOnPage),
        );
    });
    const isCoinjoinAccount = account.accountType === 'coinjoin';
    const hasEligibleUtxos = spendableUtxos.length + lowAnonymityUtxos.length > 0;

    // fetch all transactions so that we can show a transaction timestamp for each UTXO
    useEffect(() => {
        const promise = dispatch(
            fetchAllTransactionsForAccountThunk({
                accountKey: account.key,
                noLoading: true,
            }),
        );

        return () => {
            promise.abort();
        };
    }, [account, dispatch]);

    const missingToInputValues = {
        amount: <FormattedCryptoAmount value={formattedMissing} symbol={account.symbol} />,
    };

    const handleAllUtxosSelected = () => {
        setSearchQuery('');
        setSelectedPage(1);
        toggleCheckAllUtxos();
    };

    return (
        <Card>
            <Header>
                <Row justifyContent="space-between">
                    <Translation id="TR_COIN_CONTROL" />
                    <Row gap={spacings.md}>
                        <Switch isChecked={!!isCoinControlEnabled} onChange={toggleCoinControl} />
                        <Icon size={24} name="chevronUp" onClick={close} />
                    </Row>
                </Row>

                <Row justifyContent="space-between" margin={{ top: spacings.md }}>
                    <Checkbox
                        isChecked={allUtxosSelected}
                        isDisabled={!hasEligibleUtxos}
                        onClick={handleAllUtxosSelected}
                    >
                        <Text variant="tertiary">
                            <Translation id="TR_SELECTED" values={{ amount: inputs.length }} />
                        </Text>
                    </Checkbox>

                    <Column alignItems="end">
                        <Text variant="tertiary">
                            <FormattedCryptoAmount value={formattedTotal} symbol={account.symbol} />
                        </Text>

                        <MissingToInput $isVisible={isMissingVisible}>
                            <Translation id={missingToInputId} values={missingToInputValues} />
                        </MissingToInput>
                    </Column>
                </Row>
            </Header>
            {hasEligibleUtxos && (
                <Row gap={spacings.sm} margin={{ top: spacings.lg }}>
                    <UtxoSearch
                        searchQuery={searchQuery}
                        setSearch={setSearchQuery}
                        setSelectedPage={setSelectedPage}
                    />
                    <UtxoSortingSelect />
                </Row>
            )}
            {!!spendableUtxosOnPage.length && (
                <UtxoSelectionList
                    withHeader={isCoinjoinAccount}
                    heading={<Translation id="TR_PRIVATE" />}
                    description={
                        <Translation id="TR_PRIVATE_DESCRIPTION" values={{ targetAnonymity }} />
                    }
                    icon="shieldCheck"
                    iconColor={theme.legacy.BG_GREEN}
                    utxos={spendableUtxosOnPage}
                />
            )}
            {!!lowAnonymityUtxosOnPage.length && (
                <UtxoSelectionList
                    withHeader
                    heading={<Translation id="TR_NOT_PRIVATE" />}
                    description={
                        <Translation id="TR_NOT_PRIVATE_DESCRIPTION" values={{ targetAnonymity }} />
                    }
                    icon="shieldCross"
                    iconColor={theme.legacy.TYPE_DARK_ORANGE}
                    utxos={lowAnonymityUtxosOnPage}
                />
            )}
            {!hasEligibleUtxos && (
                <Empty>
                    <Translation id="TR_NO_SPENDABLE_UTXOS" />
                </Empty>
            )}
            {!!dustUtxosOnPage.length && (
                <UtxoSelectionList
                    withHeader
                    heading={<Translation id="TR_DUST" />}
                    description={<Translation id="TR_DUST_DESCRIPTION" />}
                    icon="info"
                    iconColor={theme.legacy.TYPE_LIGHT_GREY}
                    utxos={dustUtxosOnPage}
                />
            )}
            {showPagination && (
                <StyledPagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    perPage={utxosPerPage}
                    onPageSelected={setSelectedPage}
                />
            )}
        </Card>
    );
};
