import styled from 'styled-components';

import { isMacOs } from '@trezor/env-utils';
import { borders, spacingsPx } from '@trezor/theme';

import { type KeyboardKey, type Keys, keyboardKeys } from './keyboardKeys';
import { addAlphaToHex } from '../../utils/utils';
import { Row } from '../Flex/Flex';
import { Text } from '../typography/Text/Text';

// Keyboard shortcuts are irrelevant on touch devices without a physical keyboard.
const Wrapper = styled.div`
    @media (hover: none) and (pointer: coarse) {
        display: none;
    }
`;

const ShortcutContainer = styled.div`
    background-color: ${({ theme }) => addAlphaToHex(theme.borderNeutralDark, 0.09)};
    border-radius: ${borders.radii.xxs};
    padding: 0 ${spacingsPx.xxs};
    border: 1px solid ${({ theme }) => theme.elementBorderOnDarkNeutralSofter};

    /* Slashed zero so the "0" key is distinguishable from the letter "O". */
    font-variant-numeric: slashed-zero;
`;

export type ShortcutBadgeProps = {
    shortcut: Keys[];
};

export const ShortcutBadge = ({ shortcut }: ShortcutBadgeProps) => {
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
                            <ShortcutContainer key={`key-${key}-${index}`}>
                                {value}
                            </ShortcutContainer>
                        );
                    })}
                </Row>
            </Text>
        </Wrapper>
    );
};
