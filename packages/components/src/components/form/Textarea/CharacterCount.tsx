import { Box } from '../../Box/Box';
import { Text } from '../../typography/Text/Text';

export type CharacterCountProps = {
    value?: string;
    maxLength?: number;
    characterCount?: boolean | { current: number | undefined; max: number };
};

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

    return (
        <Box
            backgroundColor="legacyBackgroundTertiaryDefaultOnElevation1"
            borderRadius={4}
            padding={{ horizontal: 4, vertical: 2 }}
        >
            <Text intent="neutral" priority="secondary" typographyStyle="body-xs" as="div">
                {formattedCharacterCount}
            </Text>
        </Box>
    );
};
