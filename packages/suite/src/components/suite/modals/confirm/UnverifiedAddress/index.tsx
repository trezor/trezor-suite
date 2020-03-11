import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import * as receiveActions from '@wallet-actions/receiveActions';
import { Translation } from '@suite-components/Translation';
import { Button, P, H2, Link, colors } from '@trezor/components';
import { useKeyPress } from '@suite-utils/dom';
import { TrezorDevice, Dispatch } from '@suite-types';

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
    background: ${colors.BLACK92};
    margin: 20px 0px;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;

    button + button {
        margin-top: 10px;
    }
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    showAddress: bindActionCreators(receiveActions.showAddress, dispatch),
    showUnverifiedAddress: bindActionCreators(receiveActions.showUnverifiedAddress, dispatch),
});

type Props = {
    device: TrezorDevice;
    address: string;
    addressPath: string;
    onCancel: () => void;
} & ReturnType<typeof mapDispatchToProps>;

const ConfirmUnverifiedAddress: FunctionComponent<Props> = ({
    device,
    address,
    addressPath,
    showAddress,
    showUnverifiedAddress,
    onCancel,
}) => {
    const verifyAddress = () => {
        onCancel();
        showAddress(addressPath, address);
    };

    const unverifiedAddress = () => {
        onCancel();
        showUnverifiedAddress(addressPath, address);
    };

    const enterPressed = useKeyPress('Enter');

    if (enterPressed) {
        verifyAddress();
    }

    let deviceStatus;
    let claim;

    if (!device.connected) {
        deviceStatus = (
            <Translation
                id="TR_DEVICE_LABEL_IS_NOT_CONNECTED"
                values={{ deviceLabel: device.label }}
            />
        );
        claim = <Translation id="TR_PLEASE_CONNECT_YOUR_DEVICE" />;
    } else {
        // corner-case where device is connected but it is unavailable because it was created with different "passphrase_protection" settings
        const enable = !!(device.features && device.features.passphrase_protection);
        deviceStatus = (
            <Translation
                id="TR_DEVICE_LABEL_IS_UNAVAILABLE"
                values={{ deviceLabel: device.label }}
            />
        );
        claim = enable ? (
            <Translation id="TR_PLEASE_ENABLE_PASSPHRASE" />
        ) : (
            <Translation id="TR_PLEASE_DISABLE_PASSPHRASE" />
        );
    }

    const needsBackup = device.features && device.features.needs_backup;

    return (
        <Wrapper>
            <Content>
                <H2>{deviceStatus}</H2>
                <StyledP size="small">
                    <Translation id="TR_TO_PREVENT_PHISHING_ATTACKS_COMMA" values={{ claim }} />
                </StyledP>
            </Content>
            <Content>
                <Row>
                    <Button onClick={() => verifyAddress()}>
                        <Translation id="TR_TRY_AGAIN" />
                    </Button>
                    <Button variant="danger" onClick={() => unverifiedAddress()}>
                        <Translation id="TR_SHOW_UNVERIFIED_ADDRESS" />
                    </Button>
                </Row>
            </Content>
            {needsBackup && <Divider />}
            {needsBackup && (
                <>
                    <Content>
                        <H2>
                            <Translation
                                id="TR_DEVICE_LABEL_IS_NOT_BACKED_UP"
                                values={{ deviceLabel: device.label }}
                            />
                        </H2>
                        <StyledP size="small">
                            <Translation id="TR_IF_YOUR_DEVICE_IS_EVER_LOST" />
                        </StyledP>
                    </Content>
                    <Content>
                        <Row>
                            <Link href={`/?backup#${device.path}`}>
                                <Button>
                                    <Translation id="TR_CREATE_BACKUP_IN_3_MINUTES" />
                                </Button>
                            </Link>
                        </Row>
                    </Content>
                </>
            )}
        </Wrapper>
    );
};

export default connect(null, mapDispatchToProps)(ConfirmUnverifiedAddress);
