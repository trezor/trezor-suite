import React from 'react';
import styled from 'styled-components';
import { Button, Tooltip, Icon, colors } from '@trezor/components';
import { AppState } from '@suite-types';
import VerifyAddressTooltip from '@wallet-components/tooltips/VerifyAddressTooltip';

const Wrapper = styled(Button)`
    padding: 0;

    &:hover {
        background: transparent;
    }
`;

type ButtonProps = React.ComponentProps<typeof Button>;

interface Props extends ButtonProps {
    className?: string;
    device: AppState['suite']['device'];
    isAddressUnverified: boolean;
}

const EyeButton = (props: Props) => {
    let color: string;
    if (props.isDisabled) {
        color = colors.BLACK25;
    } else {
        color = props.isAddressUnverified ? colors.GREEN : colors.BLACK0;
    }

    return (
        <Wrapper variant="tertiary" {...props}>
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
                    color={color}
                />
            </Tooltip>
        </Wrapper>
    );
};

export default EyeButton;
