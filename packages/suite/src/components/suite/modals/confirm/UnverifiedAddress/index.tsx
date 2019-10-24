import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Link, Button, P, H5, colors } from '@trezor/components';
import { useKeyPress } from '@suite-utils/dom';
import { TrezorDevice } from '@suite-types';

import l10nCommonMessages from '../../messages';
import l10nMessages from './messages';

const Wrapper = styled.div`
    max-width: 370px;
    padding: 30px 0px;
`;

const Content = styled.div`
    padding: 0px 48px;
`;

const StyledP = styled(P)`
    && {
        padding-bottom: 20px;
    }
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: ${colors.DIVIDER};
    margin: 20px 0px;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;

    button + button {
        margin-top: 10px;
    }
`;

const BackupButton = styled(Button)`
    width: 100%;
`;

interface Props {
    device: TrezorDevice;
    addressPath?: string;
    showAddress: (accountPath: string) => void;
    showUnverifiedAddress: (accountPath: string) => void;
    onCancel: () => void;
}

const ConfirmUnverifiedAddress: FunctionComponent<Props> = ({
    device,
    addressPath,
    showAddress,
    showUnverifiedAddress,
    onCancel,
}) => {
    const verifyAddress = () => {
        if (!addressPath) return;
        onCancel();
        showAddress(addressPath);
    };

    const unverifiedAddress = () => {
        if (!addressPath) return;
        onCancel();
        showUnverifiedAddress(addressPath);
    };

    const enterPressed = useKeyPress('Enter');

    if (enterPressed) {
        verifyAddress();
    }

    let deviceStatus;
    let claim;

    if (!device.connected) {
        deviceStatus = (
            <FormattedMessage
                {...l10nMessages.TR_DEVICE_LABEL_IS_NOT_CONNECTED}
                values={{ deviceLabel: device.label }}
            />
        );
        claim = <FormattedMessage {...l10nMessages.TR_PLEASE_CONNECT_YOUR_DEVICE} />;
    } else {
        // corner-case where device is connected but it is unavailable because it was created with different "passphrase_protection" settings
        const enable = !!(device.features && device.features.passphrase_protection);
        deviceStatus = (
            <FormattedMessage
                {...l10nMessages.TR_DEVICE_LABEL_IS_UNAVAILABLE}
                values={{ deviceLabel: device.label }}
            />
        );
        claim = enable ? (
            <FormattedMessage {...l10nMessages.TR_PLEASE_ENABLE_PASSPHRASE} />
        ) : (
            <FormattedMessage {...l10nMessages.TR_PLEASE_DISABLE_PASSPHRASE} />
        );
    }

    const needsBackup = device.features && device.features.needs_backup;

    return (
        <Wrapper>
            <Content>
                <H5>{deviceStatus}</H5>
                <StyledP size="small">
                    <FormattedMessage
                        {...l10nMessages.TR_TO_PREVENT_PHISHING_ATTACKS_COMMA}
                        values={{ claim }}
                    />
                </StyledP>
            </Content>
            <Content>
                <Row>
                    <Button onClick={() => verifyAddress()}>
                        <FormattedMessage {...l10nCommonMessages.TR_TRY_AGAIN} />
                    </Button>
                    <Button isInverse variant="warning" onClick={() => unverifiedAddress()}>
                        <FormattedMessage {...l10nMessages.TR_SHOW_UNVERIFIED_ADDRESS} />
                    </Button>
                </Row>
            </Content>
            {needsBackup && <Divider />}
            {needsBackup && (
                <>
                    <Content>
                        <H5>
                            <FormattedMessage
                                {...l10nMessages.TR_DEVICE_LABEL_IS_NOT_BACKED_UP}
                                values={{ deviceLabel: device.label }}
                            />
                        </H5>
                        <StyledP size="small">
                            <FormattedMessage
                                {...l10nCommonMessages.TR_IF_YOUR_DEVICE_IS_EVER_LOST}
                            />
                        </StyledP>
                    </Content>
                    <Content>
                        <Row>
                            <Link href={`/?backup#${device.path}`} variant="nostyle">
                                <BackupButton>
                                    <FormattedMessage
                                        {...l10nCommonMessages.TR_CREATE_BACKUP_IN_3_MINUTES}
                                    />
                                </BackupButton>
                            </Link>
                        </Row>
                    </Content>
                </>
            )}
        </Wrapper>
    );
};

export default ConfirmUnverifiedAddress;
