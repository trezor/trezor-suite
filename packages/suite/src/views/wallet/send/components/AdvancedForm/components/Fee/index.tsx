import { QuestionTooltip, Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import { capitalizeFirstLetter } from '@suite-utils/string';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { Button, colors, P, Select, variables } from '@trezor/components';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { Account } from '@wallet-types';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { updateMax, findActiveMaxId } from '@wallet-actions/sendFormActions';
import { calculateEthFee } from '@wallet-utils/sendFormUtils';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';
import { FeeLevel } from 'trezor-connect';
import { fromWei, toWei } from 'web3-utils';

import CustomFee from './components/CustomFee';

const Row = styled.div`
    display: flex;
    flex-direction: column;
`;

const Text = styled.div`
    margin-right: 3px;
`;

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Top = styled.div`
    padding: 0 0 10px 0;
    display: flex;
    width: 100%;
    justify-content: space-between;
`;

const Column = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
`;

const Label = styled(Column)`
    color: ${colors.BLACK0};
`;

const Refresh = styled(Column)`
    color: ${colors.BLACK0};
    justify-content: flex-end;
`;

const RefreshText = styled.div`
    padding: 0 5px;
    cursor: pointer;
    white-space: nowrap;
    color: ${colors.RED};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const OptionWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const OptionValue = styled(P)`
    min-width: 70px;
    margin-right: 5px;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: flex-start;
    text-indent: 1ch;

    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK50};
`;

const OptionLabel = styled(P)`
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: right;
    word-break: break-all;
`;

const getValue = (
    networkType: Account['networkType'],
    option: FeeLevel,
    symbol: Account['symbol'],
) => {
    const { feePerUnit, feeLimit } = option;

    if (networkType === 'bitcoin') {
        return `${feePerUnit} sat/B`;
    }

    if (networkType === 'ethereum') {
        const fee = calculateEthFee(feePerUnit, feeLimit || '0');
        try {
            const gasPriceInWei = toWei(fee, 'gwei');
            const gasPriceInEth = fromWei(gasPriceInWei, 'ether');
            return `${gasPriceInEth} ${symbol.toUpperCase()}`;
        } catch (err) {
            return feePerUnit;
        }
    }

    return `${formatNetworkAmount(feePerUnit, symbol)} ${symbol.toUpperCase()}`;
};

export default () => {
    const {
        account,
        feeInfo,
        feeOutdated,
        selectedFee,
        setSelectedFee,
        setFeeOutdated,
        outputs,
        token,
        fiatRates,
        setTransactionInfo,
        coinFees,
    } = useSendContext();
    const { updateFeeLevel } = useActions({ updateFeeLevel: sendFormActions.updateFeeLevel });
    const { formState, setValue, errors, getValues, setError, clearError } = useFormContext();
    const dataIsDirty = formState.dirtyFields.has('ethereumData');
    const { networkType, symbol } = account;
    const customFeeHasError = errors.customFee;
    const ethereumGasPriceError = errors.ethereumGasPrice;
    const ethereumGasLimitError = errors.ethereumGasLimit;
    const showCustomFeeValue =
        !customFeeHasError && !ethereumGasPriceError && !ethereumGasLimitError;

    return (
        <Wrapper>
            <Row>
                <Top>
                    <Label>
                        <Text>
                            <Translation id="TR_FEE" />
                        </Text>
                        <QuestionTooltip messageId="TR_SEND_FEE_TOOLTIP" />
                    </Label>
                    {feeOutdated && (
                        <Refresh>
                            <RefreshText>
                                <Translation id="TR_FEE_NEEDS_UPDATE" />
                            </RefreshText>
                            <Button
                                onClick={() => {
                                    updateFeeLevel(
                                        coinFees,
                                        token,
                                        setValue,
                                        setSelectedFee,
                                        outputs,
                                        getValues,
                                        clearError,
                                        setError,
                                        fiatRates,
                                        setTransactionInfo,
                                    );
                                    setFeeOutdated(false);
                                }}
                                icon="REFRESH"
                                variant="tertiary"
                                alignIcon="right"
                            >
                                <Translation id="REFRESH" />
                            </Button>
                        </Refresh>
                    )}
                </Top>
                <Select
                    variant="small"
                    isSearchable={false}
                    // hack for react select, it needs the "value"
                    value={{ ...selectedFee, value: selectedFee.feePerUnit }}
                    onChange={async (selectedFeeLevel: FeeLevel) => {
                        if (selectedFeeLevel.label === 'custom') {
                            setSelectedFee({ ...selectedFee, label: 'custom' });
                            setValue('customFee', selectedFee.feePerUnit);
                        } else {
                            setSelectedFee(selectedFeeLevel);
                            setValue('customFee', '');
                            const activeMax = findActiveMaxId(outputs, getValues);
                            await updateMax(
                                activeMax,
                                account,
                                setValue,
                                getValues,
                                clearError,
                                setError,
                                selectedFeeLevel,
                                outputs,
                                token,
                                fiatRates,
                                setTransactionInfo,
                            );
                        }
                    }}
                    options={feeInfo.levels}
                    isDisabled={networkType === 'ethereum' && dataIsDirty}
                    formatOptionLabel={(option: FeeLevel) => (
                        <OptionWrapper>
                            <OptionLabel>{capitalizeFirstLetter(option.label)} </OptionLabel>
                            {showCustomFeeValue && option.feePerUnit !== '0' && (
                                <OptionValue>{getValue(networkType, option, symbol)}</OptionValue>
                            )}
                        </OptionWrapper>
                    )}
                />
            </Row>
            <CustomFee isVisible={networkType !== 'ethereum' && selectedFee.label === 'custom'} />
        </Wrapper>
    );
};
