import { useWatch } from 'react-hook-form';

import styled from 'styled-components';

import { CapabilityLabel, Translation } from '@suite/intl';
import { sendFormActions } from '@suite-common/wallet-core';
import { Button, Dropdown, type DropdownMenuItemProps, Switch, Text } from '@trezor/components';
import { FADE_IN } from '@trezor/components/src/config/animations';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { WalletSubpageHeading } from '#src/components/wallet';
import { useSendFormContext } from '#src/hooks/wallet';

import { useSendOptions } from './Options/sendOptions/useSendOptions';

const ClearButtonWrapper = styled.div`
    display: inline-flex;
    animation: ${FADE_IN} 0.16s;
`;

export const SendHeader = () => {
    // React Compiler: `formState` is a react-hook-form object it edits in place, so a compiled
    // render-time read of `isDirty` could freeze. Remove once this read moves to `useFormState`.
    'use no memo';

    const { dispatch } = useServices(injectDispatch);
    const {
        outputs,
        control,
        formState: { isDirty },
        toggleOption,
        addOpReturn,
        resetContext,
        loadTransaction,
        composeTransaction,
    } = useSendFormContext();
    const { options, transfer } = useSendOptions();

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
    const optionalMemo = options.memo?.identifiesRecipient ? undefined : options.memo;

    const menuItems: Array<DropdownMenuItemProps> = [
        {
            'data-testid': '@send/header-dropdown/import',
            onClick: () => {
                loadTransaction();
            },
            label: <Translation id="IMPORT_CSV" />,
            isHidden: !options.recipients?.canImport,
        },
        {
            'data-testid': '@send/header-dropdown/opreturn',
            onClick: addOpReturn,
            label: <Translation id="OP_RETURN_ADD" />,
            isDisabled: !!opreturnOutput,
            isHidden: !options.dataOutput,
        },
        {
            'data-testid': '@send/header-dropdown/locktime',
            onClick: () => {
                toggleOption('bitcoinLocktime');
                if (broadcastEnabled) toggleOption('broadcast');
            },
            label: <Translation id="LOCKTIME_ADD" />,
            isDisabled: locktimeEnabled,
            isHidden: !options.locktime,
        },
        {
            onClick: () => {
                toggleOption('transactionData');
                composeTransaction();
            },
            closeOnClick: true,
            label: <Translation id="DATA_ADD" />,
            isDisabled: dataEnabled || options.data?.isAllowed(transfer) === false,
            isHidden: !options.data,
        },
        {
            onClick: () => {
                toggleOption('destinationTag');
                composeTransaction();
            },
            closeOnClick: true,
            label: optionalMemo && <CapabilityLabel label={optionalMemo.labels.add} />,
            isDisabled: destinationTagEnabled,
            isHidden: !optionalMemo,
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
            isHidden: !options.deferredBroadcast,
        },
        {
            'data-testid': '@send/header-dropdown/ethereum-nonce',
            onClick: () => toggleOption('ethereumNonce'),
            label: <Translation id="EVM_NONCE_EDIT" />,
            isDisabled: nonceEditEnabled,
            isHidden: !options.nonce,
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
                    items={menuItems}
                />
            </WalletSubpageHeading>
        </>
    );
};
