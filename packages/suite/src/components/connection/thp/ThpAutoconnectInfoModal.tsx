import { useState } from 'react';

import { startThpAutoconnectThunk, thpActions } from '@suite-common/thp';
import { Button, Card, Column, Icon, List, Modal, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDevice, useDispatch } from '../../../hooks/suite';
import { Translation } from '../../suite/Translation';

export const ThpAutoconnectInfoModal = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { isLocked } = useDevice();
    const dispatch = useDispatch();
    const isDeviceLocked = isLocked();

    const onTurnOn = () => {
        setIsLoading(true);
        dispatch(startThpAutoconnectThunk());
    };

    const onCancel = () => {
        dispatch(thpActions.finishThpFlow());
    };

    return (
        <Modal
            heading={<Translation id="TR_THP_AUTO_CONNECT_INFO_MODAL_HEADER" />}
            data-testid="@modal/thp-autoconnect-info"
            bottomContent={
                <>
                    <Button onClick={onTurnOn} isLoading={isLoading || isDeviceLocked}>
                        <Translation id="TR_THP_TURN_ON_AUTO_CONNECT" />
                    </Button>
                    <Button onClick={onCancel} variant="tertiary" isDisabled={isLoading}>
                        <Translation id="TR_THP_TURN_ON_AUTO_CONNECT_NO_THANKS" />
                    </Button>
                </>
            }
            onCancel={onCancel}
        >
            <Card>
                <Column gap={spacings.xs}>
                    <List
                        bulletComponent={<Icon name="dotOutlineFilled" />}
                        bulletGap={spacings.xs}
                    >
                        <Text>
                            <Translation id="TR_THP_AUTO_CONNECT_INFO_MODAL_DESCRIPTION" />
                        </Text>
                    </List>
                </Column>
            </Card>
        </Modal>
    );
};
