import { Button, H3, Column, Text } from '@trezor/components';

import { useDevice, useDispatch } from 'src/hooks/suite';
import { SwitchDeviceRenderer } from 'src/views/suite/SwitchDevice/SwitchDeviceRenderer';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { Translation } from '../../../Translation';
import { passwordMismatchResetThunk } from '@suite-common/wallet-core';
import {
    addWalletThunk,
    redirectAfterWalletSelectedThunk,
} from 'src/actions/wallet/addWalletThunk';
import { WalletType } from '@suite-common/wallet-types';

export const PassphraseMismatchModal = ({ onCancel }: { onCancel: () => void }) => {
    const { isLocked, device: selectDevice } = useDevice();
    const dispatch = useDispatch();

    const isDeviceLocked = isLocked();

    if (selectDevice === undefined) {
        return null;
    }

    const onStartOver = () => {
        dispatch(passwordMismatchResetThunk({ device: selectDevice }));
        dispatch(addWalletThunk({ walletType: WalletType.PASSPHRASE, device: selectDevice }));
        dispatch(redirectAfterWalletSelectedThunk());
        onCancel();
    };

    return (
        <SwitchDeviceRenderer isCancelable={false} data-testid="@passphrase-mismatch">
            <CardWithDevice device={selectDevice} isFullHeaderVisible={false}>
                <Column gap={8} margin={{ bottom: 32 }} alignItems="center">
                    <H3 margin={{ top: 12 }}>
                        <Translation id="TR_PASSPHRASE_MISMATCH" />
                    </H3>
                    <Text variant="tertiary">
                        <Translation id="TR_PASSPHRASE_MISMATCH_DESCRIPTION" />
                    </Text>
                </Column>

                <Button
                    variant="primary"
                    onClick={onStartOver}
                    isDisabled={isDeviceLocked}
                    isFullWidth
                    data-testid="@passphrase-mismatch/start-over"
                >
                    <Translation id="TR_PASSPHRASE_MISMATCH_START_OVER" />
                </Button>
            </CardWithDevice>
        </SwitchDeviceRenderer>
    );
};
