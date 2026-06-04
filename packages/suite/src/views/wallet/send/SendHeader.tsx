import { useWatch } from 'react-hook-form';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { sendFormActions } from '@suite-common/wallet-core';
import { Button, Dropdown, type DropdownMenuItemProps, Switch, Text } from '@trezor/components';
import { FADE_IN } from '@trezor/components/src/config/animations';

import { WalletSubpageHeading } from 'src/components/wallet';
import { useDispatch } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';

const ClearButtonWrapper = styled.div`
    display: inline-flex;
    animation: ${FADE_IN} 0.16s;
`;

export const SendHeader = () => {
    const dispatch = useDispatch();
    const {
        outputs,
        control,
        account: { networkType, symbol },
        formState: { isDirty },
        toggleOption,

        addOpReturn,
        addNameOp,
        resetContext,
        loadTransaction,
    } = useSendFormContext();

    // Capability probe for Namecoin name operations.
    //
    // Once trezor/trezor-firmware#7010 lands and ships in a release we should
    // flip this gate to a real check (either a hard-coded firmware version
    // floor against `device.features.major_version`/`minor_version`/`patch_version`
    // or, preferably, a runtime probe of @trezor/connect's known
    // OutputScriptType enum for the PAYTONAMECOINOP literal).
    //
    // Until then the gate is hard-coded `false` so the menu item stays hidden
    // by default and reviewers can flip it in one place.
    //
    // TODO(namecoin): replace with a proper capability check once firmware
    // version with #7010 is known.
    const hasNameOpSupport = false;

    const enabledFormOptions = useWatch({
        name: 'options',
        defaultValue: [],
        control,
    });

    const opreturnOutput = (outputs || []).find(o => o.type === 'opreturn');
    const nameOpOutput = (outputs || []).find(o => o.type === 'name-op');
    const locktimeEnabled = enabledFormOptions.includes('bitcoinLocktime');
    const broadcastEnabled = enabledFormOptions.includes('broadcast');
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
            'data-testid': '@send/header-dropdown/name-op',
            onClick: addNameOp,
            label: <Translation id="NAME_OP_ADD" />,
            isDisabled: !!nameOpOutput,
            // Only show for Namecoin AND when the connected device firmware
            // advertises PAYTONAMECOINOP support. The latter gate is hard-coded
            // false today; see hasNameOpSupport above.
            isHidden: symbol !== 'nmc' || !hasNameOpSupport,
        },
        {
            'data-testid': '@send/header-dropdown/locktime',
            onClick: () => {
                toggleOption('bitcoinLocktime');
                if (broadcastEnabled) toggleOption('broadcast');
            },
            label: <Translation id="LOCKTIME_ADD" />,
            isDisabled: !!locktimeEnabled,
            isHidden: networkType !== 'bitcoin',
        },
        {
            'data-testid': '@send/header-dropdown/broadcast',
            onClick: () => toggleOption('broadcast'),
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
            isDisabled: !!locktimeEnabled,
            isHidden: networkType !== 'bitcoin',
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
