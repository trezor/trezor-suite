import { useState } from 'react';

import { thpActions } from '@suite-common/thp';
import { Button, Card, Column, Icon, List, Modal, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { startThpAutoconnectThunk } from '../../actions/thp/startThpAutoconnectThunk';
import { useDispatch } from '../../hooks/suite';
import { Translation } from '../suite/Translation';

export const ThpAutoconnectInfoModal = () => {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();

    const onTurnOn = () => {
        setIsLoading(true);
        dispatch(startThpAutoconnectThunk());
    };

    const onCancel = () => {
        dispatch(thpActions.resetThpFlow());
    };

    return (
        <Modal
            heading={<Translation id="TR_THP_AUTO_CONNECT_INFO_MODAL_HEADER" />}
            description={<Translation id="TR_THP_AUTO_CONNECT_INFO_MODAL_DESCRIPTION" />}
            data-testid="@modal/thp-autoconnect-info"
            bottomContent={
                <>
                    <Button onClick={onTurnOn} isLoading={isLoading}>
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
                    <Text typographyStyle="highlight">
                        <Translation id="TR_THP_TURN_ON_AUTO_CONNECT_SHIP_ON_TRUSTED_COMPUTERS" />
                    </Text>
                    <List
                        bulletComponent={<Icon name="dotOutlineFilled" />}
                        bulletGap={spacings.xs}
                    >
                        <List.Item>
                            <Translation id="TR_THP_TURN_ON_AUTO_CONNECT_LIST_1" />
                        </List.Item>
                        <List.Item>
                            <Translation id="TR_THP_TURN_ON_AUTO_CONNECT_LIST_2" />
                        </List.Item>
                        <List.Item>
                            <Translation id="TR_THP_TURN_ON_AUTO_CONNECT_LIST_3" />
                        </List.Item>
                    </List>
                </Column>
            </Card>
        </Modal>
    );
};
