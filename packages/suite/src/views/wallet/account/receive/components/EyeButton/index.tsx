import React from 'react';
import styled from 'styled-components';
import { colors, Tooltip, Icon } from '@trezor/components';
import { Button } from '@trezor/components-v2';
import { AppState } from '@suite/types/suite';
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
        color = colors.GRAY_LIGHT;
    } else {
        color = props.isAddressUnverified ? colors.ERROR_PRIMARY : colors.TEXT_PRIMARY;
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
