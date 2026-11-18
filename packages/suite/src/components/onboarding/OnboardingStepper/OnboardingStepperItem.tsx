import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { Box, Center, Icon, Row, TOOLTIP_DELAY_SHORT, Text, Tooltip } from '@trezor/components';
import { CheckIcon } from '@trezor/icons';

import { STEPPER_FILL_MS, STEPPER_RESIZE_MS } from './animationTimings';
import { type OnboardingProgress } from './getOnboardingProgress';

const INDICATOR_SIZE = 24;

type OnboardingStepperItemProps = {
    id: keyof OnboardingProgress;
    label: TranslationKey;
    progress: number;
    isActive: boolean;
    fillDelayMs: number;
    isCollapsed: boolean;
    isLast: boolean;
};

export const OnboardingStepperItem = ({
    id,
    label,
    progress,
    isActive,
    fillDelayMs,
    isCollapsed,
    isLast,
}: OnboardingStepperItemProps) => {
    const { translationString } = useTranslation();
    const isCompleted = progress === 1 && !isActive;
    const inactiveBorderColor = isCompleted ? 'contentBrand' : 'elementBorderField';
    const labelText = translationString(label);

    return (
        <Box
            aria-label={`${labelText} ${Math.round(progress * 100)}%`}
            aria-current={isActive ? 'step' : undefined}
            data-testid={`@onboarding/stepper/${id}`}
            as="li"
        >
            <Tooltip
                content={labelText}
                isActive={isCollapsed}
                placement="right"
                cursor="default"
                delayShow={TOOLTIP_DELAY_SHORT}
                width="100%"
            >
                <Row gap={16} minHeight={INDICATOR_SIZE} aria-hidden="true">
                    <Box
                        position={{ type: 'relative' }}
                        width={INDICATOR_SIZE}
                        flex="0 0 auto"
                        height={INDICATOR_SIZE}
                        borderRadius="full"
                        borderWidth={2}
                        borderOffset={-2}
                        borderColor={
                            isActive ? 'elementBorderOnDarkBrandSofter' : inactiveBorderColor
                        }
                        backgroundColor={isCompleted ? 'contentBrand' : 'elementFillField'}
                        transition={`background-color ${STEPPER_FILL_MS}ms ease-out, outline-color ${STEPPER_FILL_MS}ms ease-out`}
                    >
                        <Center>
                            <Box
                                position={{ type: 'absolute', top: '20%', left: '20%' }}
                                width="60%"
                                height="60%"
                                borderRadius="full"
                                backgroundColor="contentBrand"
                                opacity={isActive ? 1 : 0}
                                transition={`opacity ${STEPPER_FILL_MS}ms ease-out`}
                            />
                            <Box
                                opacity={isCompleted ? 1 : 0}
                                transition={`opacity ${STEPPER_FILL_MS}ms ease-out`}
                            >
                                <Icon as={CheckIcon} size={12} color="contentPrimaryInverse" />
                            </Box>
                        </Center>
                    </Box>
                    {!isCollapsed && (
                        <Text
                            typographyStyle="body-md"
                            color={isActive ? 'contentBrand' : 'contentSecondary'}
                            overflowWrap="anywhere"
                            transition={`color ${STEPPER_FILL_MS}ms ease-out`}
                        >
                            <Translation id={label} />
                        </Text>
                    )}
                </Row>
            </Tooltip>
            {!isLast && (
                <Row
                    aria-hidden="true"
                    width={INDICATOR_SIZE}
                    justifyContent="center"
                    padding={{ vertical: 6 }}
                >
                    <Box
                        width={2}
                        height={isActive ? 40 : 10}
                        overflow="hidden"
                        borderRadius="full"
                        transition={`height ${STEPPER_RESIZE_MS}ms ease-in-out`}
                        backgroundColor="elementBorderField"
                    >
                        <Box
                            width="100%"
                            height="100%"
                            backgroundColor="contentBrand"
                            transform={`scaleY(${progress})`}
                            transformOrigin="top"
                            transition={`transform ${STEPPER_FILL_MS}ms ease-out ${fillDelayMs}ms, opacity ${STEPPER_FILL_MS}ms ease-out ${fillDelayMs}ms`}
                            opacity={isCompleted ? 0 : 1}
                        />
                    </Box>
                </Row>
            )}
        </Box>
    );
};
