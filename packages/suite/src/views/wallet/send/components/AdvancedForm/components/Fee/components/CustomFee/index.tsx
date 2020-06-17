import { FiatValue } from '@suite-components';
import { Translation } from '@suite-components/Translation';
import { useSendContext, SendContext } from '@suite/hooks/wallet/useSendContext';
import { Input, Select } from '@trezor/components';
import { Account } from '@wallet-types';
import BigNumber from 'bignumber.js';
import { getInputState, findActiveMaxId, updateMax } from '@wallet-utils/sendFormUtils';
import React from 'react';
import { useFormContext, FieldError, NestDataObject } from 'react-hook-form';
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

const getError = (
    error: NestDataObject<Record<string, any>, FieldError>,
    minFee: number,
    maxFee: number,
) => {
    const notInRangeError = 'TR_CUSTOM_FEE_NOT_IN_RANGE';
    const { type } = error;

    switch (type) {
        case notInRangeError:
            return <Translation id={notInRangeError} values={{ maxFee, minFee }} />;

        default:
            return <Translation id={error.type} />;
    }
};

export default ({ isVisible }: { isVisible: boolean }) => {
    const {
        account,
        feeInfo,
        transactionInfo,
        setSelectedFee,
        outputs,
        selectedFee,
        token,
        fiatRates,
        setTransactionInfo,
    } = useSendContext();
    const { register, errors, getValues, setValue, clearError, setError } = useFormContext();
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
                        const newFeeLevel: SendContext['selectedFee'] = {
                            ...selectedFee,
                            feePerUnit: event.target.value,
                        };
                        setSelectedFee(newFeeLevel);
                        const activeMax = findActiveMaxId(outputs, getValues);
                        await updateMax(
                            activeMax,
                            account,
                            setValue,
                            getValues,
                            clearError,
                            setError,
                            newFeeLevel,
                            outputs,
                            token,
                            fiatRates,
                            setTransactionInfo,
                        );
                    }}
                    innerRef={register({
                        validate: {
                            TR_CUSTOM_FEE_IS_NOT_SET: (value: string) => {
                                if (!value) {
                                    return false;
                                }
                            },
                            TR_CUSTOM_FEE_IS_NOT_NUMBER: (value: string) => {
                                return validator.isNumeric(value);
                            },
                            TR_CUSTOM_FEE_NOT_IN_RANGE: (value: string) => {
                                const customFeeBig = new BigNumber(value);
                                return !(
                                    customFeeBig.isGreaterThan(maxFee) ||
                                    customFeeBig.isLessThan(minFee)
                                );
                            },
                        },
                    })}
                    bottomText={error && getError(error, maxFee, minFee)}
                />
            </CustomFeeWrapper>
            <CustomFeeUnitWrapper>
                <Select
                    name={inputNameUnit}
                    innerRef={register()}
                    value={getValue(networkType)}
                    variant="small"
                    isDisabled
                />
            </CustomFeeUnitWrapper>
            <FiatValueWrapper>
                {transactionInfo && transactionInfo.type !== 'error' && (
                    <FiatValue
                        amount={transactionInfo.fee}
                        symbol={symbol}
                        badge={{ color: 'gray' }}
                    />
                )}
            </FiatValueWrapper>
        </Wrapper>
    );
};
