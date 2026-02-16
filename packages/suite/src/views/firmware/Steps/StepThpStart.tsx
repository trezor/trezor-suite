import { ReactNode, useState } from 'react';

import { Translation } from '@suite/intl';
import { Card, Column, Modal, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { startThpSessionThunk } from '../../../actions/thp/startThpSessionThunk';
import { useDispatch } from '../../../hooks/suite';

type StepThpStartProps = {
    modalHeading: ReactNode;
};

export const StepThpStart = ({ modalHeading }: StepThpStartProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();

    const onClick = () => {
        setIsLoading(true);
        dispatch(startThpSessionThunk());
    };

    return (
        <Modal.ModalBase
            onCancel={undefined} // intentionally NOT cancellable here,  cancellable on the device only
            data-testid="@firmware-modal"
            heading={modalHeading}
            bottomContent={
                <Modal.Button onClick={onClick} isLoading={isLoading}>
                    <Translation id="TR_CONTINUE" />
                </Modal.Button>
            }
        >
            <Card>
                <Column alignItems="start" gap={spacings.xxs}>
                    <Text typographyStyle="highlight">
                        <Translation id="TR_THP_CONFIRM_SECURE_CONNECTION" />
                    </Text>
                    <Text
                        intent="neutral"
                        priority="secondary"
                        typographyStyle="body"
                        align="center"
                    >
                        <Translation id="TR_THP_CREATE_SECURE_CONNECTION_DESCRIPTION" />
                    </Text>
                </Column>
            </Card>
        </Modal.ModalBase>
    );
};
