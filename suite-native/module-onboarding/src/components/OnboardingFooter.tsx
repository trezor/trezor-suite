import { useRoute } from '@react-navigation/native';
import { RequireAllOrNone } from 'type-fest';

import { Button, Stack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { OnboardingStackRoutes } from '@suite-native/navigation';

const wrapperStyle = prepareNativeStyle(utils => ({
    width: '100%',
    paddingHorizontal: utils.spacings.medium,
    marginBottom: 28,
}));

type OnboardingFooterProps = {
    nextButtonTitle?: string;
    redirectTarget: () => void;
} & RequireAllOrNone<
    { backButtonTitle?: string; onBack?: () => void },
    'backButtonTitle' | 'onBack'
>;

export const OnboardingFooter = ({
    backButtonTitle,
    nextButtonTitle,
    redirectTarget,
    onBack,
}: OnboardingFooterProps) => {
    const { applyStyle } = useNativeStyles();
    const route = useRoute();

    const buttonTitle = route.name === OnboardingStackRoutes.Welcome ? 'Get started' : 'Next';

    return (
        <Stack spacing="medium" style={applyStyle(wrapperStyle)}>
            {onBack && (
                <Button
                    colorScheme="tertiaryElevation0"
                    testID={`@onboarding/${route.name}/backBtn`}
                    onPress={onBack}
                >
                    {backButtonTitle ?? 'Back'}
                </Button>
            )}

            <Button testID={`@onboarding/${route.name}/nextBtn`} onPress={redirectTarget}>
                {nextButtonTitle ?? buttonTitle}
            </Button>
        </Stack>
    );
};
