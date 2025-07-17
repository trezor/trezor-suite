import { useEffect, useState } from 'react';

import { selectBlockchainHeightBySymbol } from '@suite-common/wallet-core';
import { datetimeToLocktime } from '@suite-common/wallet-utils';
import { Card, IconButton, Row, Select } from '@trezor/components';

import { TextColumn } from 'src/components/suite';
import { useSelector, useTranslation } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';

import { LocktimeBlockHeight, inputName as blockHeightInputName } from './LocktimeBlockHeight';
import { LocktimeDatetime, inputName as datetimeInputName } from './LocktimeDatetime';
import { canLocktimeTxBeBroadcast } from './canLocktimeTxBeBroadcast';

const LOCKTIME_OPTIONS = [
    {
        label: 'Block',
        value: 'block',
    },
    {
        label: 'Date (UTC)',
        value: 'date',
    },
];

type LocktimeProps = {
    close: () => void;
};

export const Locktime = ({ close }: LocktimeProps) => {
    const {
        formState: { errors },
        network,
        resetDefaultValue,
        toggleOption,
        watch,
    } = useSendFormContext();

    const [locktimeBlockHeight, locktimeDatetime] = watch([
        blockHeightInputName,
        datetimeInputName,
    ]);

    const [locktimeOption, setLocktimeOption] = useState(locktimeBlockHeight ? 'block' : 'date');

    const { translationString } = useTranslation();

    const options = watch('options');
    const broadcastEnabled = options.includes('broadcast');
    const blockchainHeight = useSelector(state =>
        selectBlockchainHeightBySymbol(state, network.symbol),
    );

    const blockHeightError = errors[blockHeightInputName];
    const datetimeError = errors[datetimeInputName];

    useEffect(() => {
        if (
            blockHeightError === undefined &&
            datetimeError === undefined &&
            !canLocktimeTxBeBroadcast({
                locktimeBlockHeight: Number(locktimeBlockHeight),
                locktimeDatetime: datetimeToLocktime(locktimeDatetime),
                currentBlockHeight: blockchainHeight,
            }) &&
            broadcastEnabled
        ) {
            toggleOption('broadcast');
        }
    }, [
        blockHeightError,
        datetimeError,
        locktimeBlockHeight,
        locktimeDatetime,
        blockchainHeight,
        broadcastEnabled,
        toggleOption,
    ]);

    const locktimeOptionSelect = (
        <Select
            options={LOCKTIME_OPTIONS}
            defaultValue={LOCKTIME_OPTIONS.find(option => option.value === locktimeOption)}
            onChange={v => {
                if (v.value !== locktimeOption)
                    resetDefaultValue(
                        locktimeOption === 'block'
                            ? 'bitcoinLocktimeBlockHeight'
                            : 'bitcoinLocktimeDatetime',
                    );
                setLocktimeOption(v.value);
            }}
            isClean
            data-testid="locktime-option"
        />
    );

    return (
        <Card>
            <Row justifyContent="space-between" alignItems="start">
                <TextColumn
                    title={translationString('LOCKTIME_ADD')}
                    description={translationString('LOCKTIME_DESCRIPTION')}
                />
                <IconButton icon="x" size="small" variant="tertiary" onClick={close} />
            </Row>
            {locktimeOption == 'block' ? (
                <LocktimeBlockHeight innerAddon={locktimeOptionSelect} />
            ) : (
                <LocktimeDatetime innerAddon={locktimeOptionSelect} />
            )}
        </Card>
    );
};
