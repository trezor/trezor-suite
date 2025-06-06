import { Box, GradientOverlay, Row, Text, useElevation } from '@trezor/components';
import { nextElevation, spacings } from '@trezor/theme';

import type { AddressItem } from 'src/hooks/wallet/sign-verify/useSignAddressOptions';

type HiddenAddressRowProps = {
    item: AddressItem;
    isElevated?: boolean;
    className?: string;
};

export const HiddenAddressRow = ({
    item,
    isElevated = false,
    className,
}: HiddenAddressRowProps) => {
    const { parentElevation } = useElevation();

    const currentElevation = isElevated ? nextElevation[parentElevation] : parentElevation;

    const pathParts = item.value.split('/');

    return (
        <Row
            className={`${className} react-select__single-value`}
            gap={spacings.xxs}
            cursor="pointer"
        >
            <Box minWidth={36}>
                <Text variant="disabled">/{pathParts[pathParts.length - 1]}</Text>
            </Box>
            <Box position={{ type: 'relative' }} cursor="pointer" userSelect="none">
                <GradientOverlay forcedElevation={currentElevation} hiddenFrom="160px" />
                {item.label}
            </Box>
        </Row>
    );
};
