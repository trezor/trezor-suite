import styled from 'styled-components';
import { borders, spacings, spacingsPx, typography } from '@trezor/theme';

const Container = styled.div`
    position: absolute;
    bottom: ${spacings.md - spacings.xxxs}px;
    right: ${spacings.md}px;
    padding: ${spacingsPx.xxxs} ${spacingsPx.xxs};
    background: ${({ theme }) => theme.backgroundTertiaryDefaultOnElevation1};
    box-shadow: ${({ theme }) => theme.boxShadowBase};
    border-radius: ${borders.radii.xxs};
    color: ${({ theme }) => theme.textSubdued};
    ${typography.label};
`;

export interface CharacterCountProps {
    value?: string;
    maxLength?: number;
    characterCount?: boolean | { current: number | undefined; max: number };
}

export const CharacterCount = ({ value, maxLength, characterCount }: CharacterCountProps) => {
    const getCharacterCount = () => {
        // controlled component
        if (characterCount === true && value !== undefined && maxLength !== undefined) {
            return `${value.length} / ${maxLength}`;
        }
        // uncontrolled component
        if (typeof characterCount === 'object') {
            return `${characterCount.current ?? 0} / ${characterCount.max}`;
        }
    };

    const formattedCharacterCount = getCharacterCount();

    if (!formattedCharacterCount) {
        return null;
    }

    return <Container>{formattedCharacterCount}</Container>;
};
