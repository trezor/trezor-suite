import React from 'react';
import styled from 'styled-components';
import { colors, Tooltip, Icon, Button } from '@trezor/components';
import { showAddress } from '@suite/actions/wallet/receiveActions';
import { AppState } from '@suite/types/suite';
import VerifyAddressTooltip from '../tooltips/VerifyAddressTooltip';

const EyeButton = styled(Button)`
    padding: 0;

    &:hover {
        background: transparent;
    }
`;

interface Props {
    className?: string;
    device: AppState['suite']['device'];
    accountPath: string;
    isAddressVerifying: boolean;
    isAddressUnverified: boolean;
    isAddressHidden: boolean;
    isAddressVerified: boolean;
    showAddress: typeof showAddress;
}

const ShowOnTrezorEyeButton = (props: Props) => {
    return (
        <EyeButton isTransparent onClick={() => props.showAddress(props.accountPath)} {...props}>
            <Tooltip
                placement="top"
                content={
                    <VerifyAddressTooltip
                        isConnected={props.device ? props.device.connected : false}
                        isAvailable={props.device ? props.device.available : false}
                        addressUnverified={props.isAddressUnverified}
                    />
                }
            >
                <Icon
                    size={16}
                    icon={props.isAddressUnverified ? 'EYE_CROSSED' : 'EYE'}
                    color={props.isAddressUnverified ? colors.ERROR_PRIMARY : colors.TEXT_PRIMARY}
                />
            </Tooltip>
        </EyeButton>
    );
};

export default ShowOnTrezorEyeButton;
