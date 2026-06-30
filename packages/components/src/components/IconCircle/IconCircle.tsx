import { type IconCircleIntent, type IconCircleSize } from './types';
import {
    mapIntentToBackground,
    mapIntentToBorderColor,
    mapSizeToBorderWidth,
    mapSizeToIconSize,
} from './utils';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
} from '../../utils/frameProps';
import { Box } from '../Box/Box';
import { Center } from '../Flex/Flex';
import { Icon, type IconComponent } from '../Icon/Icon';

export const allowedIconCircleFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedIconCircleFrameProps)[number]>;

export type IconCircleProps = {
    icon: IconComponent;
    size?: IconCircleSize;
    intent?: IconCircleIntent;
} & AllowedFrameProps;

export const IconCircle = ({ icon, size = 40, intent = 'brand', ...rest }: IconCircleProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedIconCircleFrameProps, false);

    return (
        <Box
            flex="none"
            borderWidth={mapSizeToBorderWidth(size)}
            borderColor={mapIntentToBorderColor(intent)}
            backgroundColor={mapIntentToBackground(intent, size)}
            borderRadius={80}
            width={size}
            height={size}
            {...frameProps}
        >
            <Center>
                <Icon
                    as={icon}
                    size={mapSizeToIconSize(size)}
                    intent={intent}
                    priority="secondary"
                />
            </Center>
        </Box>
    );
};

export type { IconCircleIntent, IconCircleSize };
