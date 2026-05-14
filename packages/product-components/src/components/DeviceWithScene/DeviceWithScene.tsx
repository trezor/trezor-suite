import styled from 'styled-components';

import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import {
    type FrameProps,
    type FramePropsKeys,
    Image,
    type ObjectFit,
    type TransientProps,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '@trezor/components';
import { type DeviceModelInternal } from '@trezor/device-utils';
import { borders, paletteV2 } from '@trezor/theme';

import { getLargeModelImagePath } from '../../utils/getModelFrontColor';

export const allowedDeviceWithSceneFrameProps = [
    'margin',
    'width',
    'height',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedDeviceWithSceneFrameProps)[number]>;

const Container = styled.div<TransientProps<AllowedFrameProps>>`
    position: relative;

    ${withFrameProps}
`;

const TouchContainer = styled.div<{ $scale: number }>`
    position: absolute;
    top: 30%;
    left: 40%;
`;

const GhostsContainer = styled.div``;

const GhostContainer = styled.div<{ $rotate: number; $x: string; $y: string }>`
    transform: rotate(${({ $rotate }) => $rotate}deg);
    background-color: ${paletteV2.lightRed600};
    border-radius: ${borders.radii.full};
    position: absolute;
    top: ${({ $y }) => $y};
    left: ${({ $x }) => $x};
    width: 64px;
    height: 64px;
    font-size: 10px;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export type DeviceWithSceneProps = AllowedFrameProps & {
    deviceModel: DeviceModelInternal;
    scene?: 'ghost' | 'confirm';
    unitColor?: number;
    objectFit?: ObjectFit;
};

const BASE_HEIGHT = 400;

const Ghost = ({ rotate, x, y }: { rotate: number; x: string; y: string }) => (
    <GhostContainer $rotate={rotate} $x={x} $y={y}>
        <Image image="GHOST" width="80%" />
    </GhostContainer>
);

export const DeviceWithScene = ({
    deviceModel = DEFAULT_FLAGSHIP_MODEL,
    scene,
    unitColor,
    objectFit,
    ...rest
}: DeviceWithSceneProps) => {
    const frameProps = pickAndPrepareFrameProps(
        rest,
        allowedDeviceWithSceneFrameProps,
    ) as TransientProps<AllowedFrameProps>;
    const image = getLargeModelImagePath(deviceModel, unitColor);

    return (
        <Container {...frameProps}>
            <Image
                image={image}
                width={frameProps.$width}
                height={frameProps.$height}
                objectFit={objectFit}
            />
            {scene === 'confirm' && (
                <TouchContainer
                    $scale={
                        frameProps.$height && typeof frameProps.$height === 'number'
                            ? frameProps.$height / BASE_HEIGHT
                            : 1
                    }
                >
                    <Image image="TOUCH" />
                </TouchContainer>
            )}
            {scene === 'ghost' && (
                <GhostsContainer>
                    <Ghost rotate={15} x="80%" y="8%" />
                    <Ghost rotate={-30} x="-5%" y="60%" />
                </GhostsContainer>
            )}
        </Container>
    );
};
