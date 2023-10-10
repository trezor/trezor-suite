import { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';

import { COMPOSE_ERROR_TYPES } from '@suite-common/wallet-constants';
import { fetchTransactionsThunk } from '@suite-common/wallet-core';
import { amountToSatoshi, formatNetworkAmount } from '@suite-common/wallet-utils';
import { FormattedCryptoAmount, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Pagination } from 'src/components/wallet';
import { Checkbox, Icon, Switch, variables } from '@trezor/components';
import { useSendFormContext } from 'src/hooks/wallet';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { selectCurrentTargetAnonymity } from 'src/reducers/wallet/coinjoinReducer';
import { UtxoSelectionList } from './UtxoSelectionList';
import { getTxsPerPage } from '@suite-common/suite-utils';

const Row = styled.div`
    align-items: center;
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const SecondRow = styled(Row)`
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    margin-top: 20px;
    padding-bottom: 14px;
`;

const GreyText = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
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
    /* using visibility rather than display to prevent line height change */
    visibility: ${({ isVisible }) => !isVisible && 'hidden'};
`;

const Empty = styled.div`
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    margin-bottom: 12px;
    padding: 14px 0;
`;

const StyledPagination = styled(Pagination)`
    margin: 20px 0;
`;

interface CoinControlProps {
    close: () => void;
}

export const CoinControl = ({ close }: CoinControlProps) => {
    const [currentPage, setSelectedPage] = useState(1);

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
        : Number(amountToSatoshi(totalOutputs.toString(), network.decimals));
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

    // pagination
    const totalItems = account.utxo?.length || 0;
    const utxosPerPage = getTxsPerPage(account.networkType);
    const showPagination = totalItems > utxosPerPage;

    // UTXOs and categories displayed on page
    let previousItemsLength = 0;
    const [spendableUtxosOnPage, lowAnonymityUtxosOnPage, dustUtxosOnPage] = [
        spendableUtxos,
        lowAnonymityUtxos,
        dustUtxos,
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
            fetchTransactionsThunk({
                accountKey: account.key,
                page: 2,
                perPage: getTxsPerPage(account.networkType),
                noLoading: true,
                recursive: true,
            }),
        );
        return () => {
            promise.abort();
        };
    }, [account, dispatch]);

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
                    isDisabled={!hasEligibleUtxos}
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
            {!!spendableUtxosOnPage.length && (
                <UtxoSelectionList
                    withHeader={isCoinjoinAccount}
                    heading={<Translation id="TR_PRIVATE" />}
                    description={
                        <Translation id="TR_PRIVATE_DESCRIPTION" values={{ targetAnonymity }} />
                    }
                    icon="SHIELD_CHECK"
                    iconColor={theme.BG_GREEN}
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
                    icon="SHIELD_CROSS"
                    iconColor={theme.TYPE_DARK_ORANGE}
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
                    icon="INFO"
                    iconColor={theme.TYPE_LIGHT_GREY}
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
        </>
    );
};
