import { useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { selectBlockchainHeightBySymbol } from '@suite-common/wallet-core';
import { datetimeToLocktime } from '@suite-common/wallet-utils';
import { Card, Column, IconButton, Row, Select, Tooltip } from '@trezor/components';
import { XIcon } from '@trezor/icons';

import { OpenGuideFromTooltip } from 'src/components/guide';
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
            data-testid="locktime-option"
            size="small"
            isClean
        />
    );

    return (
        <Card>
            <Column gap={16}>
                <Row justifyContent="space-between" alignItems="start">
                    <Tooltip
                        addon={
                            <OpenGuideFromTooltip id="/3_send-and-receive/transactions-in-depth/locktime.md" />
                        }
                        content={<Translation id="LOCKTIME_ADD_TOOLTIP" />}
                        hasIcon
                    >
                        <Translation id="LOCKTIME_ADD" />
                    </Tooltip>
                    <IconButton
                        icon={XIcon}
                        intent="neutral"
                        priority="secondary"
                        size="small"
                        onClick={close}
                        tooltip={{ content: <Translation id="TR_CLOSE" /> }}
                    />
                </Row>
                {locktimeOption == 'block' ? (
                    <LocktimeBlockHeight rightContent={locktimeOptionSelect} />
                ) : (
                    <LocktimeDatetime rightContent={locktimeOptionSelect} />
                )}
            </Column>
        </Card>
    );
};
