import { Box, GradientOverlay, Row, Text, useElevation } from '@trezor/components';
import { nextElevation, spacings } from '@trezor/theme';

import type { AddressItem } from 'src/hooks/wallet/sign-verify/useSignAddressOptions';

type HiddenAddressRowProps = {
    item: AddressItem;
    isElevated?: boolean;
};

export const HiddenAddressRow = ({ item, isElevated = false }: HiddenAddressRowProps) => {
    const { parentElevation } = useElevation();

    const currentElevation = isElevated ? nextElevation[parentElevation] : parentElevation;

    const pathParts = item.value.split('/');

    return (
        <div className="react-select__single-value">
            <Row gap={spacings.xxs} cursor="pointer">
                <Box minWidth={36}>
                    <Text isDisabled>/{pathParts[pathParts.length - 1]}</Text>
                </Box>
                <Box position={{ type: 'relative' }} cursor="pointer" userSelect="none">
                    <GradientOverlay forcedElevation={currentElevation} hiddenFrom="160px" />
                    {item.label}
                </Box>
            </Row>
        </div>
    );
};
