import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { Icon, Input, Switch, variables } from '@trezor/components';
import { getInputState, isInteger } from '@suite-common/wallet-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import { isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { useTranslation } from 'src/hooks/suite';

const Wrapper = styled.div`
    margin-bottom: 25px;
`;

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Text = styled.div`
    height: 18px;
    margin-left: 8px;
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const RbfMessage = styled.div`
    display: flex;
    flex: 1;
    margin-top: 10px;
`;

const Left = styled.div`
    margin-right: 8px;
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
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const Description = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

interface LocktimeProps {
    close: () => void;
}

export const Locktime = ({ close }: LocktimeProps) => {
    const {
        network,
        register,
        getDefaultValue,
        setValue,
        toggleOption,
        formState: { errors },
        composeTransaction,
    } = useSendFormContext();

    const { translationString } = useTranslation();

    const options = getDefaultValue('options', []);
    const rbfEnabled = options.includes('bitcoinRBF');
    const broadcastEnabled = options.includes('broadcast');
    const inputName = 'bitcoinLockTime';
    const inputValue = getDefaultValue(inputName) || '';
    const error = errors[inputName];
    const { ref: inputRef, ...inputField } = register(inputName, {
        onChange: () => {
            if (!error) {
                if (rbfEnabled) toggleOption('bitcoinRBF');
                if (broadcastEnabled) toggleOption('broadcast');
            }
            composeTransaction(inputName);
        },
        required: translationString('LOCKTIME_IS_NOT_SET'),
        validate: (value = '') => {
            const amountBig = new BigNumber(value);
            if (amountBig.isNaN()) {
                return translationString('LOCKTIME_IS_NOT_NUMBER');
            }
            if (amountBig.lte(0)) {
                return translationString('LOCKTIME_IS_TOO_LOW');
            }
            if (!isInteger(value)) {
                return translationString('LOCKTIME_IS_NOT_INTEGER');
            }
            // max unix timestamp * 2 (2147483647 * 2)
            if (amountBig.gt(4294967294)) {
                return translationString('LOCKTIME_IS_TOO_BIG');
            }
        },
    });

    return (
        <Wrapper>
            <Input
                inputState={getInputState(error, inputValue)}
                defaultValue={inputValue}
                maxLength={formInputsMaxLength.btcLocktime}
                label={
                    <Label>
                        <Icon size={16} icon="CALENDAR" />
                        <Text>
                            <Translation id="LOCKTIME_SCHEDULE_SEND" />
                        </Text>
                    </Label>
                }
                labelRight={<Icon size={18} icon="CROSS" onClick={close} />}
                bottomText={error?.message || null}
                data-test="locktime-input"
                innerRef={inputRef}
                {...inputField}
            />
            {isFeatureFlagEnabled('RBF') && network.features?.includes('rbf') && (
                <RbfMessage>
                    <Left>
                        <Icon size={16} icon="RBF" />
                    </Left>
                    <Center>
                        <Title>
                            <Translation id={rbfEnabled ? 'RBF_ON' : 'RBF_OFF'} />
                        </Title>
                        <Description>
                            <Translation id="RBF_DESCRIPTION" />
                        </Description>
                    </Center>
                    <Right>
                        <Switch
                            isChecked={rbfEnabled}
                            onChange={() => {
                                if (inputValue.length > 0) {
                                    setValue(inputName, '');
                                }
                                toggleOption('bitcoinRBF');
                                composeTransaction(inputName);
                            }}
                        />
                    </Right>
                </RbfMessage>
            )}
        </Wrapper>
    );
};
