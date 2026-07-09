import styled from 'styled-components';

import { isMacOs } from '@trezor/env-utils';
import { borders, spacingsPx } from '@trezor/theme';

import { type KeyboardKey, type Keys, keyboardKeys } from './keyboardKeys';
import { Row } from '../Flex/Flex';
import { Text } from '../typography/Text/Text';

// Keyboard shortcuts are irrelevant on touch devices without a physical keyboard.
const Wrapper = styled.div`
    @media (hover: none) and (pointer: coarse) {
        display: none;
    }
`;

const ShortcutContainer = styled.div<{ $isInverse: boolean }>`
    background-color: ${({ theme, $isInverse }) =>
        $isInverse ? theme.elementFillOnDarkNeutralSoft : theme.elementFillNeutralSoft};
    border-radius: ${borders.radii.xxs};
    padding: 0 ${spacingsPx.xxs};

    /* Slashed zero so the "0" key is distinguishable from the letter "O". */
    font-variant-numeric: slashed-zero;
`;

export type ShortcutBadgeProps = {
    shortcut: Keys[];
    isInverse?: boolean;
};

export const ShortcutBadge = ({ shortcut, isInverse = false }: ShortcutBadgeProps) => {
    const isMac = isMacOs();

    return (
        <Wrapper>
            <Text as="div" typographyStyle="body-xs" case="uppercase">
                <Row gap={2}>
                    {shortcut.map((key, index) => {
                        const keyObject: KeyboardKey = keyboardKeys[key];
                        const value = isMac
                            ? (keyObject.valueMac ?? keyObject.value)
                            : keyObject.value;

                        return (
                            <ShortcutContainer key={`key-${key}-${index}`} $isInverse={isInverse}>
                                {value}
                            </ShortcutContainer>
                        );
                    })}
                </Row>
            </Text>
        </Wrapper>
    );
};
