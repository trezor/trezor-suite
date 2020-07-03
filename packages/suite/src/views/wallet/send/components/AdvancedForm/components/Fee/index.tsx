import React from 'react';
import styled from 'styled-components';
import { SEND } from '@wallet-actions/constants';
import { QuestionTooltip, Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import { useSendFormContext } from '@wallet-hooks';
import { capitalizeFirstLetter } from '@suite-utils/string';
import { Button, colors, P, Select, variables } from '@trezor/components';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { Account } from '@wallet-types';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { Controller } from 'react-hook-form';
import { calculateEthFee } from '@wallet-utils/sendFormUtils';

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
    const { formContext, sendContext } = useSendFormContext();
    const { formState, setValue, errors, register, getValues, setError, clearError } = formContext;
    const {
        account,
        feeInfo,
        feeOutdated,
        selectedFee,
        outputs,
        token,
        fiatRates,
        coinFees,
        updateContext,
    } = sendContext;

    const { updateFeeLevel, setLastUsedFeeLevel } = useActions({
        updateFeeLevel: sendFormActions.updateFeeLevel,
        setLastUsedFeeLevel: sendFormActions.setLastUsedFeeLevel,
    });
    const dataIsDirty = formState.dirtyFields.has('ethereumData');
    const selectName = 'selectedFee';
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
                                    // updateFeeLevel(
                                    //     coinFees,
                                    //     token,
                                    //     setValue,
                                    //     setSelectedFee: () => console.log("unnecessary callback"),
                                    //     outputs,
                                    //     getValues,
                                    //     clearError,
                                    //     setError: () => console.log("unnecessary callback"),
                                    //     fiatRates,
                                    //     setTransactionInfo: () => console.log("unnecessary callback"),
                                    // );
                                    updateContext({ feeOutdated: false });
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
                <Controller
                    as={Select}
                    name={selectName}
                    innerRef={register()}
                    // hack for react select, it needs the "value"
                    defaultValue={{ ...selectedFee, value: selectedFee.feePerUnit }}
                    isSearchable={false}
                    variant="small"
                    onChange={([selected]) => {
                        // preserve fee level for next transaction
                        setLastUsedFeeLevel(selected.label, symbol);
                        return { ...selected };
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
