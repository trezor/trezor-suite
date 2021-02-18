import React from 'react';
import styled, { css } from 'styled-components';

import { resolveStaticPath } from '@suite-utils/build';
import { Image } from '@suite-components';

const StyledImg = styled.img`
    flex: 1 0 auto;
    margin: auto;

    ${props =>
        props.theme.IMAGE_FILTER &&
        css`
            filter: ${props.theme.IMAGE_FILTER};
        `}
`;
interface Props {
    model: number;
}

export const InitImg = ({ model, ...props }: Props) => (
    <StyledImg alt="" src={resolveStaticPath(`images/svg/firmware-init-${model}.svg`)} {...props} />
);

export const SuccessImg = ({ model, ...props }: Props) => (
    <StyledImg
        alt=""
        src={resolveStaticPath(`images/svg/firmware-success-${model}.svg`)}
        {...props}
    />
);

export const WarningImg = () => (
    <StyledImg alt="" src={resolveStaticPath(`images/svg/uni-warning.svg`)} />
);

export const ErrorImg = () => (
    <StyledImg alt="" src={resolveStaticPath(`images/svg/uni-error.svg`)} />
);

export const DisconnectImg = () => (
    <StyledImg alt="" src={resolveStaticPath(`images/svg/disconnect-device.svg`)} />
);

export const ConnectInNormalImg = () => <Image image="CONNECT_DEVICE" />;

export const ConnectInBootloaderImg = ({ model }: Props) => (
    <StyledImg
        alt=""
        src={resolveStaticPath(`images/svg/how-to-enter-bootloader-model-${model}.svg`)}
    />
);

// todo: another image (not exportable from zeplin atm)
// see here:
// https://github.com/styled-components/styled-components/issues/2473
export const SeedImg = styled(props => <Image image="RECOVER_FROM_SEED" {...props} />)`
    height: 250px;
    padding: 30px;
`;
