import styled from 'styled-components';
import { Button, Dropdown, DropdownMenuItemProps } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { WalletSubpageHeading } from 'src/components/wallet';
import { sendFormActions } from '@suite-common/wallet-core';
import { FADE_IN } from '@trezor/components/src/config/animations';
import { ConnectDeviceSendPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';

// eslint-disable-next-line local-rules/no-override-ds-component
const ClearButton = styled(Button)`
    animation: ${FADE_IN} 0.16s;
`;

export const SendHeader = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const {
        outputs,
        account: { networkType },
        formState: { isDirty },

        addOpReturn,
        resetContext,
        loadTransaction,
    } = useSendFormContext();

    const opreturnOutput = (outputs || []).find(o => o.type === 'opreturn');
    const options: Array<DropdownMenuItemProps> = [
        {
            'data-testid': '@send/header-dropdown/opreturn',
            onClick: addOpReturn,
            label: <Translation id="OP_RETURN_ADD" />,
            isDisabled: !!opreturnOutput,
            isHidden: networkType !== 'bitcoin',
        },
        {
            'data-testid': '@send/header-dropdown/import',
            onClick: () => {
                loadTransaction();
            },
            label: <Translation id="IMPORT_CSV" />,
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
    const isDeviceConnected = device?.connected && device?.available;

    return (
        <>
            {!isDeviceConnected && <ConnectDeviceSendPromo />}
            <WalletSubpageHeading title="TR_NAV_SEND">
                {isDirty && (
                    <ClearButton
                        size="small"
                        variant="tertiary"
                        onClick={resetContext}
                        data-testid="clear-form"
                    >
                        <Translation id="TR_CLEAR_ALL" />
                    </ClearButton>
                )}

                <Dropdown
                    alignMenu="bottom-right"
                    data-testid="@send/header-dropdown"
                    items={[
                        {
                            key: 'header',
                            options,
                        },
                    ]}
                />
            </WalletSubpageHeading>
        </>
    );
};
