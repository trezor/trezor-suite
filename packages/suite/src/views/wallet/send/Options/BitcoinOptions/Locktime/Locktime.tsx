import { BigNumber } from '@trezor/utils/src/bigNumber';
import styled from 'styled-components';
import { NumberInput, Translation } from 'src/components/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { Card, IconLegacy, IconButton } from '@trezor/components';
import { getInputState, isInteger } from '@suite-common/wallet-utils';
import { useSelector, useTranslation } from 'src/hooks/suite';
import { spacingsPx } from '@trezor/theme';
import { selectNetworkBlockchainInfo } from '@suite-common/wallet-core';
import { useEffect } from 'react';
import { canLocktimeTxBeBroadcast } from './canLocktimeTxBeBroadcast';

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
        network,
        watch,
    } = useSendFormContext();

    const blockchain = useSelector(selectNetworkBlockchainInfo(network.symbol));

    const { translationString } = useTranslation();

    const options = getDefaultValue('options', []);
    const broadcastEnabled = options.includes('broadcast');
    const inputName = 'bitcoinLockTime';
    const defaultInputValue = getDefaultValue(inputName) || '';
    const error = errors[inputName];

    const locktime = watch('bitcoinLockTime');

    useEffect(() => {
        if (
            error === undefined &&
            !canLocktimeTxBeBroadcast({
                locktime: locktime !== undefined ? Number(locktime) : undefined,
                currentBlockHeight: blockchain.blockHeight,
            }) &&
            broadcastEnabled
        ) {
            toggleOption('broadcast');
        }

        composeTransaction(inputName);
    }, [locktime, blockchain, toggleOption, broadcastEnabled, composeTransaction, error]);

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
                defaultValue={defaultInputValue}
                rules={rules}
                label={
                    <Label>
                        <IconLegacy size={16} icon="CALENDAR" />
                        <Translation id="LOCKTIME_SCHEDULE_SEND" />
                    </Label>
                }
                labelRight={
                    <IconButton icon="CROSS" size="tiny" variant="tertiary" onClick={close} />
                }
                bottomText={error?.message || null}
                data-testid="locktime-input"
            />
        </Card>
    );
};
