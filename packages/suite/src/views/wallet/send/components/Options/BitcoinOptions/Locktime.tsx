import BigNumber from 'bignumber.js';
import styled from 'styled-components';
import { NumberInput, Translation } from 'src/components/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { Card, Icon, IconButton, Paragraph, Switch } from '@trezor/components';
import { getInputState, isInteger } from '@suite-common/wallet-utils';
import { isFeatureFlagEnabled } from '@suite-common/suite-utils';
import { useTranslation } from 'src/hooks/suite';
import { spacingsPx } from '@trezor/theme';

const RbfIcon = styled(Icon)`
    padding-top: ${spacingsPx.xs};
`;

const Label = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
`;

const RbfMessage = styled.div`
    display: flex;
    flex: 1;
    margin-top: ${spacingsPx.xs};
    gap: ${spacingsPx.xs};
`;

const Center = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Description = styled(Paragraph)`
    color: ${({ theme }) => theme.textSubdued};
`;

interface LocktimeProps {
    close: () => void;
}

export const Locktime = ({ close }: LocktimeProps) => {
    const {
        network,
        control,
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

    const handleLocktimeChange = () => {
        if (!error) {
            if (rbfEnabled) toggleOption('bitcoinRBF');
            if (broadcastEnabled) toggleOption('broadcast');
        }
        composeTransaction(inputName);
    };

    const rules = {
        required: translationString('LOCKTIME_IS_NOT_SET'),
        validate: (value = '') => {
            const amountBig = new BigNumber(value);

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
    };

    const handleRbfSwitch = () => {
        if (inputValue.length > 0) {
            setValue(inputName, '');
        }

        toggleOption('bitcoinRBF');
        composeTransaction(inputName);
    };

    return (
        <Card>
            <NumberInput
                control={control}
                name={inputName}
                inputState={getInputState(error)}
                defaultValue={inputValue}
                onChange={handleLocktimeChange}
                rules={rules}
                label={
                    <Label>
                        <Icon size={16} icon="CALENDAR" />
                        <Translation id="LOCKTIME_SCHEDULE_SEND" />
                    </Label>
                }
                labelRight={
                    <IconButton icon="CROSS" size="tiny" variant="tertiary" onClick={close} />
                }
                bottomText={error?.message || null}
                data-test="locktime-input"
            />

            {isFeatureFlagEnabled('RBF') && network.features?.includes('rbf') && (
                <RbfMessage>
                    <RbfIcon size={16} icon="RBF" />

                    <Center>
                        <Paragraph type="highlight">
                            <Translation id={rbfEnabled ? 'RBF_ON' : 'RBF_OFF'} />
                        </Paragraph>

                        <Description type="hint">
                            <Translation id="RBF_DESCRIPTION" />
                        </Description>
                    </Center>

                    <Switch isChecked={rbfEnabled} onChange={handleRbfSwitch} />
                </RbfMessage>
            )}
        </Card>
    );
};
