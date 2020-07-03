import React from 'react';
import { Translation } from '@suite-components/Translation';
import { Input } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';
import { getInputState } from '@wallet-utils/sendFormUtils';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import validator from 'validator';

interface WrapperProps {
    isVisible: boolean;
}

const Wrapper = styled.div<WrapperProps>`
    display: ${props => (props.isVisible ? 'flex' : 'none')};
    padding-left: 11px;
`;

export default ({ isVisible }: { isVisible: boolean }) => {
    const { feeInfo, selectedFee, updateContext, errors, register } = useSendFormContext();
    const { maxFee, minFee } = feeInfo;
    const error = errors.customFee;

    return (
        <Wrapper isVisible={isVisible}>
            <Input
                variant="small"
                name="customFee"
                width={150}
                state={getInputState(error)}
                onChange={async event => {
                    const newFeeLevel = {
                        ...selectedFee,
                        feePerUnit: event.target.value,
                    };
                    updateContext({ selectedFee: newFeeLevel });
                }}
                innerRef={register({
                    validate: {
                        notSet: (value: string) => {
                            if (!value) {
                                return <Translation id="TR_CUSTOM_FEE_IS_NOT_SET" />;
                            }

                            if (!validator.isNumeric(value)) {
                                return <Translation id="TR_CUSTOM_FEE_IS_NOT_NUMBER" />;
                            }

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
        </Wrapper>
    );
};
