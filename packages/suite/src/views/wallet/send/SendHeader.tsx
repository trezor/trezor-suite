import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { useDispatch } from '@suite-common/redux-utils';
import { type NetworkType } from '@suite-common/wallet-config';
import { sendFormActions } from '@suite-common/wallet-core';
import { Button, Dropdown, type DropdownMenuItemProps, Switch, Text } from '@trezor/components';
import { FADE_IN } from '@trezor/components/src/config/animations';

import { WalletSubpageHeading } from 'src/components/wallet';
import { useSendFormContext } from 'src/hooks/wallet';

const BROADCAST_SUPPORTED_NETWORK_TYPES: NetworkType[] = [
    'bitcoin',
    'ethereum',
    'ripple',
    'stellar',
];

const ClearButtonWrapper = styled.div`
    display: inline-flex;
    animation: ${FADE_IN} 0.16s;
`;

export const SendHeader = () => {
    const dispatch = useDispatch();
    const {
        outputs,
        control,
        account: { networkType },
        formState: { isDirty },
        watch,
        resetDefaultValue,
        toggleOption,

        addOpReturn,
        resetContext,
        loadTransaction,
        composeTransaction,
    } = useSendFormContext();

    const enabledFormOptions = useWatch({
        name: 'options',
        defaultValue: [],
        control,
    });

    const opreturnOutput = (outputs || []).find(o => o.type === 'opreturn');
    const locktimeEnabled = enabledFormOptions.includes('bitcoinLocktime');
    const broadcastEnabled = enabledFormOptions.includes('broadcast');
    const dataEnabled = enabledFormOptions.includes('transactionData');
    const nonceEditEnabled = enabledFormOptions.includes('ethereumNonce');
    const destinationTagEnabled = enabledFormOptions.includes('destinationTag');
    const token = watch('outputs.0.token');

    useEffect(() => {
        // disable data option if sending Tron token
        if (networkType === 'tron' && token && dataEnabled) {
            toggleOption('transactionData');
            resetDefaultValue('transactionData');
        }
    }, [networkType, dataEnabled, token, toggleOption, resetDefaultValue]);

    const options: Array<DropdownMenuItemProps> = [
        {
            'data-testid': '@send/header-dropdown/import',
            onClick: () => {
                loadTransaction();
            },
            label: <Translation id="IMPORT_CSV" />,
            isHidden: networkType !== 'bitcoin',
        },
        {
            'data-testid': '@send/header-dropdown/opreturn',
            onClick: addOpReturn,
            label: <Translation id="OP_RETURN_ADD" />,
            isDisabled: !!opreturnOutput,
            isHidden: networkType !== 'bitcoin',
        },
        {
            'data-testid': '@send/header-dropdown/locktime',
            onClick: () => {
                toggleOption('bitcoinLocktime');
                if (broadcastEnabled) toggleOption('broadcast');
            },
            label: <Translation id="LOCKTIME_ADD" />,
            isDisabled: locktimeEnabled,
            isHidden: networkType !== 'bitcoin',
        },
        {
            onClick: () => {
                toggleOption('transactionData');
                composeTransaction();
            },
            closeOnClick: true,
            label: <Translation id="DATA_ADD" />,
            isDisabled: dataEnabled || !!token,
            isHidden: networkType !== 'ethereum' && networkType !== 'tron',
        },
        {
            onClick: () => {
                toggleOption('destinationTag');
                composeTransaction();
            },
            closeOnClick: true,
            label: <Translation id={networkType === 'tron' ? 'TR_TRON_NOTE_ADD' : 'MEMO_SWITCH'} />,
            isDisabled: destinationTagEnabled,
            isHidden: networkType !== 'tron' && networkType !== 'solana',
        },
        {
            'data-testid': '@send/header-dropdown/broadcast',
            onClick: () => {
                toggleOption('broadcast');
                composeTransaction();
            },
            closeOnClick: false,
            label: (
                <Switch
                    isDisabled={!!locktimeEnabled}
                    isChecked={broadcastEnabled}
                    labelPosition="start"
                    label={
                        <Text
                            typographyStyle="body-sm"
                            intent="neutral"
                            isDisabled={locktimeEnabled}
                            textWrap="nowrap"
                        >
                            <Translation id="BROADCAST" />
                        </Text>
                    }
                />
            ),
            isDisabled: locktimeEnabled,
            isHidden: !BROADCAST_SUPPORTED_NETWORK_TYPES.includes(networkType),
        },
        {
            'data-testid': '@send/header-dropdown/ethereum-nonce',
            onClick: () => toggleOption('ethereumNonce'),
            label: <Translation id="EVM_NONCE_EDIT" />,
            isDisabled: nonceEditEnabled,
            isHidden: networkType !== 'ethereum',
        },
        {
            'data-testid': '@send/header-dropdown/raw',
            onClick: () => {
                dispatch(sendFormActions.sendRaw(true));
            },
            label: <Translation id="SEND_RAW" />,
        },
    ];

    return (
        <>
            <WalletSubpageHeading data-testid="@wallet/send-header" title="TR_NAV_SEND">
                {isDirty && (
                    <ClearButtonWrapper>
                        <Button
                            intent="neutral"
                            priority="secondary"
                            onClick={resetContext}
                            data-testid="clear-form"
                        >
                            <Translation id="TR_CLEAR_ALL" />
                        </Button>
                    </ClearButtonWrapper>
                )}

                <Dropdown
                    placement={{ position: 'bottom', alignment: 'start' }}
                    data-testid="@send/header-dropdown"
                    tooltip={{ content: <Translation id="TR_SHOW_MORE" />, placement: 'left' }}
                    items={options}
                />
            </WalletSubpageHeading>
        </>
    );
};
