import { IconButton } from '@trezor/components';
import { borders } from '@trezor/theme';
import styled from 'styled-components';

export const ActionButton = styled(IconButton)`
    width: 100%;
    border-radius: ${borders.radii.sm};
`;
