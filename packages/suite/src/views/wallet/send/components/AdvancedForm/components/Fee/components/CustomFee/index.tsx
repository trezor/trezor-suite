import { FiatValue } from '@suite-components';
import { Translation } from '@suite-components/Translation';
import validator from 'validator';
import { useSendContext } from '@suite/hooks/wallet/useSendContext';
import { Input, Select } from '@trezor/components';
import { getState } from '@wallet-utils/sendFormUtils';
import { Account } from '@wallet-types';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    margin-top: 10px;
    padding: 0 0 30px 0;
    justify-content: space-between;
    align-items: center;

    &:last-child {
        padding: 0;
    }
`;

const CustomFeeWrapper = styled.div``;

const ItemWrapper = styled.div`
    min-width: 80px;
    max-width: 80px;
    padding-right: 10px;
`;

const getValue = (networkType: Account['networkType']) => {
    if (networkType === 'bitcoin') {
        return { value: 'sat', label: 'sat/B' };
    }

    if (networkType === 'ripple') {
        return { value: 'drop', label: 'drops' };
    }
};

export default () => {
    const { account, feeInfo } = useSendContext();
    const { register, getValues, setValue, errors } = useFormContext();
    const inputName = 'custom-fee';
    const inputNameUnit = 'custom-fee-unit';
    const { networkType, symbol } = account;
    const customFeeValue = getValues(inputName);
    const error = errors[inputName];
    const { maxFee, minFee } = feeInfo;

    return (
        <Wrapper>
            <CustomFeeWrapper>
                <Wrapper>
                    <ItemWrapper>
                        <Input
                            variant="small"
                            name={inputName}
                            state={getState(error)}
                            innerRef={register({
                                validate: {
                                    TR_ETH_DATA_NOT_HEX: (value: string) => {
                                        if (value) {
                                            return validator.isHexadecimal(value);
                                        }
                                    },
                                },
                            })}
                            bottomText={() => {
                                const notInRangeError = 'TR_CUSTOM_FEE_NOT_IN_RANGE';
                                const { type } = error;

                                switch (type) {
                                    case notInRangeError:
                                        return (
                                            <Translation
                                                id={notInRangeError}
                                                values={{ maxFee, minFee }}
                                            />
                                        );

                                    default:
                                        return error && <Translation id={error.type} />;
                                }
                            }}
                        />
                    </ItemWrapper>
                    <ItemWrapper>
                        <Select
                            name={inputNameUnit}
                            innerRef={register()}
                            onChange={() => setValue(inputName, getValue(networkType))}
                            variant="small"
                            isDisabled
                        />
                    </ItemWrapper>
                </Wrapper>
            </CustomFeeWrapper>
            {customFeeValue && (
                <FiatValue amount={customFeeValue} symbol={symbol} badge={{ color: 'gray' }} />
            )}
        </Wrapper>
    );
};
