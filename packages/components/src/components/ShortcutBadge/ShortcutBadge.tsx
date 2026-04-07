import styled from 'styled-components';

import { isMacOs } from '@trezor/env-utils';
import { borders, spacingsPx } from '@trezor/theme';

import { type KeyboardKey, type Keys, keyboardKeys } from './keyboardKeys';
import { addAlphaToHex } from '../../utils/utils';
import { Row } from '../Flex/Flex';
import { Text } from '../typography/Text/Text';

const ShortcutContainer = styled.div`
    background-color: ${({ theme }) => addAlphaToHex(theme.borderNeutralDark, 0.09)};
    border-radius: ${borders.radii.xxs};
    padding: 0 ${spacingsPx.xxs};
`;

export type ShortcutBadgeProps = {
    shortcut: Keys[];
};

export const ShortcutBadge = ({ shortcut }: ShortcutBadgeProps) => {
    const isMac = isMacOs();

    return (
        <Text as="div" typographyStyle="body-xs" case="uppercase">
            <Row gap={2}>
                {shortcut.map((key, index) => {
                    const keyObject: KeyboardKey = keyboardKeys[key];
                    const value = isMac ? (keyObject.valueMac ?? keyObject.value) : keyObject.value;

                    return (
                        <ShortcutContainer key={`key-${key}-${index}`}>{value}</ShortcutContainer>
                    );
                })}
            </Row>
        </Text>
    );
};
