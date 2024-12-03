import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';

export type AboutProps = {
    onPressAbout: () => void;
};

export const About = ({ onPressAbout }: AboutProps) => (
    <Box marginHorizontal="sp32" alignItems="center">
        <Text textAlign="center" color="textSubdued">
            <Translation
                id="moduleSettings.viewOnly.subtitle"
                values={{
                    about: chunk => (
                        <Link
                            label={chunk}
                            onPress={onPressAbout}
                            isUnderlined
                            textColor="textSubdued"
                            textPressedColor="textSubdued"
                        />
                    ),
                }}
            />
        </Text>
    </Box>
);
