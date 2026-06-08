import { Box, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const fiatValueStyle = prepareNativeStyle(utils => ({
    marginTop: -utils.spacings.sp4,
}));

type TransactionDetailTargetsSectionProps = {
    topTarget: React.ReactNode | null;
    bottomTarget: React.ReactNode | null;
    icon: React.ReactNode;
};

export const TransactionDetailTargetsSection = ({
    topTarget,
    bottomTarget,
    icon,
}: TransactionDetailTargetsSectionProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <>
            <VStack spacing="sp16" alignItems="center" justifyContent="center">
                {icon}

                {topTarget && <Box flexDirection="row">{topTarget}</Box>}
            </VStack>

            {bottomTarget && (
                <Box flexDirection="row" style={applyStyle(fiatValueStyle)}>
                    <Text color="contentSecondary">≈ </Text>
                    {bottomTarget}
                </Box>
            )}
        </>
    );
};
