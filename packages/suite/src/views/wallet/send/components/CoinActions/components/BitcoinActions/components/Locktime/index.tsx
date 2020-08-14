import React from 'react';
import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { useSendFormContext } from '@wallet-hooks';
import { Icon, Input, Switch, variables, colors } from '@trezor/components';
import { getInputState } from '@wallet-utils/sendFormUtils';

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
    close: () => void;
}

export default ({ close }: Props) => {
    const {
        register,
        getDefaultValue,
        setValue,
        errors,
        composeTransaction,
    } = useSendFormContext();

    const bitcoinRBF = getDefaultValue('bitcoinRBF');
    const inputName = 'bitcoinLockTime';
    const inputValue = getDefaultValue(inputName) || '';
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
                onChange={() => {
                    if (!error && bitcoinRBF) setValue('bitcoinRBF', false);
                    composeTransaction(inputName, !!error);
                }}
                label={
                    <Label>
                        <Icon size={16} icon="CALENDAR" />
                        <Text>
                            <Translation id="TR_SCHEDULE_SEND" />
                        </Text>
                    </Label>
                }
                labelRight={<StyledIcon size={20} icon="CROSS" onClick={close} />}
                bottomText={<InputError error={error} />}
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
