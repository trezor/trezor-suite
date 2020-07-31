import React from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { useSendFormContext } from '@wallet-hooks';
import { Icon, Input, Switch, variables, colors } from '@trezor/components';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { BTC_RBF_SEQUENCE } from '@wallet-constants/sendForm';

const Wrapper = styled.div`
    margin-bottom: 25px;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    padding: 0 4px;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const RbfMessage = styled.div`
    display: flex;
    flex: 1;
    margin-top: 10px;
`;

const Left = styled.div`
    padding-right: 5px;
`;

const Center = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Right = styled.div`
    display: flex;
    align-items: center;
    max-width: 40px;
`;

const Title = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const Description = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

interface Props {
    setIsActive: (isActive: boolean) => void;
}

const RBF_VALUE = BTC_RBF_SEQUENCE.toString();

export default ({ setIsActive }: Props) => {
    const {
        register,
        control,
        getValues,
        setValue,
        errors,
        composeTransaction,
    } = useSendFormContext();

    const bitcoinRBF = getValues('bitcoinRBF');
    const inputName = 'bitcoinLockTime';
    const inputValue = getValues(inputName) || '';
    const error = errors[inputName];

    return (
        <Wrapper>
            <Input
                state={getInputState(error, inputValue)}
                monospace
                name={inputName}
                data-test={inputName}
                defaultValue={inputValue}
                innerRef={register({
                    required: 'TR_LOCKTIME_IS_NOT_SET',
                    validate: (value: string) => {
                        const amountBig = new BigNumber(value);
                        if (amountBig.isNaN()) {
                            return 'TR_LOCKTIME_IS_NOT_NUMBER';
                        }
                        if (amountBig.lte(0)) {
                            return 'TR_LOCKTIME_IS_TOO_LOW';
                        }
                        if (!amountBig.isInteger()) {
                            return 'TR_LOCKTIME_IS_NOT_INTEGER';
                        }
                    },
                })}
                placeholder={bitcoinRBF ? RBF_VALUE : ''}
                onChange={event => {
                    const isRBF = event.target.value === RBF_VALUE;
                    if (!error && isRBF && !bitcoinRBF) setValue('bitcoinRBF', true);
                    if (!error && !isRBF && bitcoinRBF) setValue('bitcoinRBF', false);
                    composeTransaction(inputName, !!error);
                }}
                bottomText={error && error.message}
                label={
                    <Label>
                        <Icon size={16} icon="CALENDAR" />
                        <Text>
                            <Translation id="TR_SCHEDULE_SEND" />
                        </Text>
                    </Label>
                }
                labelRight={
                    <StyledIcon
                        size={20}
                        icon="CROSS"
                        onClick={() => {
                            // Since `bitcoinLockTime` field is registered conditionally
                            // every time it mounts it will set defaultValue from draft
                            // to prevent that behavior reset defaultValue in `react-hook-form.control.defaultValuesRef`
                            const { current } = control.defaultValuesRef;
                            // @ts-ignore: react-hook-form type returns "unknown" (bug?)
                            if (current && current.bitcoinLockTime) current.bitcoinLockTime = '';
                            // reset current value
                            setValue(inputName, '');
                            // callback
                            setIsActive(false);
                        }}
                    />
                }
            />
            <RbfMessage>
                <Left>
                    <Icon size={16} icon="RBF" />
                </Left>
                <Center>
                    <Title>
                        <Translation id="TR_RBF_OFF_TITLE" />
                    </Title>
                    <Description>
                        <Translation id="TR_RBF_OFF_DESCRIPTION" />
                    </Description>
                </Center>
                <Right>
                    <Switch
                        checked={bitcoinRBF}
                        onChange={checked => {
                            if (inputValue.length > 0) {
                                setValue(inputName, '');
                            }
                            setValue('bitcoinRBF', checked);
                            composeTransaction(inputName, false);
                        }}
                    />
                </Right>
            </RbfMessage>
        </Wrapper>
    );
};
