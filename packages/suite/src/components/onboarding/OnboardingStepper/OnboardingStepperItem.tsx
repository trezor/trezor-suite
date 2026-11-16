import styled from 'styled-components';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { Box, Center, Icon, Row, TOOLTIP_DELAY_SHORT, Text, Tooltip } from '@trezor/components';
import { CheckIcon } from '@trezor/icons';

import { STEPPER_FILL_MS, STEPPER_RESIZE_MS } from './animationTimings';
import { type OnboardingProgress } from './getOnboardingProgress';

const INDICATOR_SIZE = 24;

const Item = styled.li`
    list-style: none;

    * {
        transition-property: transform, outline-color, background-color, opacity, color;
        transition-duration: ${STEPPER_FILL_MS}ms;
        transition-timing-function: ease-out;
    }

    @media (prefers-reduced-motion: reduce) {
        * {
            transition: none !important;
        }
    }
`;

const Track = styled.div<{ $isActive: boolean }>`
    width: 2px;
    height: ${({ $isActive }) => ($isActive ? 40 : 10)}px;
    background: ${({ theme }) => theme.elementBorderField};
    overflow: hidden;
    transition-property: height;
    transition-duration: ${STEPPER_RESIZE_MS}ms;
    transition-timing-function: ease-in-out;
`;

const Fill = styled.div<{
    $progress: number;
    $isCompleted: boolean;
    $fillDelayMs: number;
}>`
    width: 100%;
    height: 100%;
    background: ${({ theme }) => theme.contentBrand};
    opacity: ${({ $isCompleted }) => ($isCompleted ? 0 : 1)};
    transform: scaleY(${({ $progress }) => $progress});
    transform-origin: top;
    transition-delay: ${({ $fillDelayMs }) => $fillDelayMs}ms, 0ms;
    will-change: transform;
`;

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
        <Item
            aria-label={`${labelText} ${Math.round(progress * 100)}%`}
            aria-current={isActive ? 'step' : undefined}
            data-testid={`@onboarding/stepper/${id}`}
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
                    >
                        <Center>
                            <Box
                                position={{ type: 'absolute', top: '20%', left: '20%' }}
                                width="60%"
                                height="60%"
                                borderRadius="full"
                                backgroundColor="contentBrand"
                                opacity={isActive ? 1 : 0}
                            />
                            <Box opacity={isCompleted ? 1 : 0}>
                                <Icon as={CheckIcon} size={12} color="contentPrimaryInverse" />
                            </Box>
                        </Center>
                    </Box>
                    {!isCollapsed && (
                        <Text
                            typographyStyle="body-md"
                            color={isActive ? 'contentBrand' : 'contentSecondary'}
                            overflowWrap="anywhere"
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
                    <Track $isActive={isActive}>
                        <Fill
                            $progress={progress}
                            $isCompleted={isCompleted}
                            $fillDelayMs={fillDelayMs}
                        />
                    </Track>
                </Row>
            )}
        </Item>
    );
};
