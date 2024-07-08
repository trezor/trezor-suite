import { BigNumber } from '@trezor/utils/src/bigNumber';
import styled from 'styled-components';
import { NumberInput, Translation } from 'src/components/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { Card, Icon, IconButton } from '@trezor/components';
import { getInputState, isInteger } from '@suite-common/wallet-utils';
import { useTranslation } from 'src/hooks/suite';
import { spacingsPx } from '@trezor/theme';

const Label = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
`;

interface LocktimeProps {
    close: () => void;
}

export const Locktime = ({ close }: LocktimeProps) => {
    const {
        control,
        getDefaultValue,
        toggleOption,
        formState: { errors },
        composeTransaction,
    } = useSendFormContext();

    const { translationString } = useTranslation();

    const options = getDefaultValue('options', []);
    const broadcastEnabled = options.includes('broadcast');
    const inputName = 'bitcoinLockTime';
    const inputValue = getDefaultValue(inputName) || '';
    const error = errors[inputName];

    const handleLocktimeChange = () => {
        if (!error) {
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
        </Card>
    );
};
