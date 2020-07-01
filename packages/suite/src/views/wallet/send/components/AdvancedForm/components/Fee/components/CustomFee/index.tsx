import { FiatValue } from '@suite-components';
import { Translation } from '@suite-components/Translation';
import { Input, Select } from '@trezor/components';
import { findActiveMaxId } from '@wallet-actions/sendFormActions';
import { useSendFormContext } from '@wallet-hooks';
import { Account } from '@wallet-types';
import { getFee, getInputState } from '@wallet-utils/sendFormUtils';
import BigNumber from 'bignumber.js';
import React from 'react';
import { Controller, FieldError, NestDataObject } from 'react-hook-form';
import styled from 'styled-components';
import validator from 'validator';

interface WrapperProps {
    isVisible: boolean;
}

const Wrapper = styled.div<WrapperProps>`
    display: ${props => (props.isVisible ? 'flex' : 'none')};
    flex-direction: row;
    margin-top: 10px;
    justify-content: center;
`;

const CustomFeeWrapper = styled.div`
    min-width: 80px;
    max-width: 80px;
`;

const CustomFeeUnitWrapper = styled.div`
    width: 80px;
    padding-left: 10px;
`;

const FiatValueWrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

const getValue = (networkType: Account['networkType']) => {
    if (networkType === 'bitcoin') {
        return { value: 'sat', label: 'sat/B' };
    }

    if (networkType === 'ripple') {
        return { value: 'drop', label: 'drops' };
    }
};

export default ({ isVisible }: { isVisible: boolean }) => {
    const { formContext, sendContext } = useSendFormContext();
    const {
        account,
        feeInfo,
        transactionInfo,
        // setSelectedFee,
        outputs,
        selectedFee,
        token,
        fiatRates,
        // setTransactionInfo,
        updateContext,
    } = sendContext;
    const { register, errors, getValues, setValue, clearError, setError } = formContext;
    const inputNameValue = 'customFee';
    const inputNameUnit = 'customFeeUnit';
    const { networkType, symbol } = account;
    const error = errors[inputNameValue];
    const { maxFee, minFee } = feeInfo;

    return (
        <Wrapper isVisible={isVisible}>
            <CustomFeeWrapper>
                <Input
                    variant="small"
                    name={inputNameValue}
                    state={getInputState(error)}
                    onChange={async event => {
                        const newFeeLevel = {
                            ...selectedFee,
                            feePerUnit: event.target.value,
                        };
                        updateContext({ selectedFee: newFeeLevel });

                        if (!error) {
                            const activeMax = findActiveMaxId(outputs, getValues);
                            // await updateMax(
                            //     activeMax,
                            //     account,
                            //     setValue,
                            //     getValues,
                            //     clearError,
                            //     setError,
                            //     newFeeLevel,
                            //     outputs,
                            //     token,
                            //     fiatRates,
                            //     setTransactionInfo,
                            // );
                        }
                    }}
                    innerRef={register({
                        validate: {
                            notSet: (value: string) => {
                                if (!value) {
                                    return <Translation id="TR_CUSTOM_FEE_IS_NOT_SET" />;
                                }
                            },
                            notNumber: (value: string) => {
                                if (!validator.isNumeric(value)) {
                                    return <Translation id="TR_CUSTOM_FEE_IS_NOT_NUMBER" />;
                                }
                            },
                            TR_CUSTOM_FEE_NOT_IN_RANGE: (value: string) => {
                                const customFeeBig = new BigNumber(value);
                                if (
                                    customFeeBig.isGreaterThan(maxFee) ||
                                    customFeeBig.isLessThan(minFee)
                                )
                                    return <Translation id="TR_CUSTOM_FEE_NOT_IN_RANGE" />;
                            },
                        },
                    })}
                    bottomText={error && error.message}
                />
            </CustomFeeWrapper>
            <CustomFeeUnitWrapper>
                <Controller
                    as={Select}
                    name={inputNameUnit}
                    innerRef={register()}
                    defaultValue={getValue(networkType)}
                    variant="small"
                    isDisabled
                />
            </CustomFeeUnitWrapper>
            <FiatValueWrapper>
                {transactionInfo && transactionInfo.type !== 'error' && (
                    <FiatValue
                        amount={getFee(transactionInfo, networkType, symbol)}
                        symbol={symbol}
                        badge={{ color: 'gray' }}
                    />
                )}
            </FiatValueWrapper>
        </Wrapper>
    );
};
