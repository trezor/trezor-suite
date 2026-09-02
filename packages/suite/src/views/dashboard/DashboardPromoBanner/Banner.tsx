import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Box, Button, Column, Flex, IconButton, Text } from '@trezor/components';
import { XIcon } from '@trezor/icons';
import { type Color } from '@trezor/theme';

import { useBannerResponsiveValue } from './useBannerResponsiveValue';

type BannerProps = {
    title: ReactNode;
    description: ReactNode;
    image: ReactNode;
    ctaLabel: ReactNode;
    onCTAClick: () => void;
    onClose: () => void;
    ctaHref?: string;
    backgroundColor?: Color;
    imageBackgroundColor?: Color;
    'data-testid'?: string;
};

const CloseButtonContainer = styled.div`
    position: absolute;
    top: 12px;
    right: 12px;
    backdrop-filter: blur(10px);
    border-radius: 12px;
`;

export const Banner = ({
    title,
    description,
    image,
    ctaLabel,
    onCTAClick,
    onClose,
    ctaHref,
    backgroundColor = 'surfaceFillSunken',
    imageBackgroundColor = 'elementFillNeutralSofter',
    'data-testid': dataTestId,
}: BannerProps) => {
    const getResponsiveValue = useBannerResponsiveValue();

    return (
        <Box
            height={getResponsiveValue({
                default: '212px',
                tablet: 'auto',
            })}
            backgroundColor={backgroundColor}
            position={{ type: 'relative' }}
            overflow="hidden"
        >
            <Flex
                height="100%"
                alignItems="stretch"
                justifyContent="space-between"
                direction={getResponsiveValue({
                    default: 'row',
                    tablet: 'column',
                })}
            >
                <Column
                    justifyContent="space-between"
                    padding={getResponsiveValue({
                        default: { left: 24, right: 32, bottom: 24, top: 16 },
                        laptop: { horizontal: 24, bottom: 24, top: 16 },
                        tablet: { horizontal: 12, top: 8, bottom: 4 },
                    })}
                    flex="1"
                    gap={12}
                >
                    <Column
                        padding={getResponsiveValue({
                            default: {},
                            tablet: { right: 24 },
                        })}
                    >
                        <Text
                            typographyStyle={getResponsiveValue({
                                default: 'headline-md',
                                desktop: 'headline-sm',
                                laptop: 'headline-sm',
                                tablet: 'body-md',
                            })}
                        >
                            {title}
                        </Text>
                        <Text
                            typographyStyle={getResponsiveValue({
                                default: 'headline-sm',
                                laptop: 'body-md',
                                tablet: 'body-sm',
                            })}
                            color="contentSecondary"
                        >
                            {description}
                        </Text>
                    </Column>
                    <Button
                        intent="neutral"
                        onClick={onCTAClick}
                        size={getResponsiveValue({
                            default: 'medium',
                            tablet: 'small',
                        })}
                        href={ctaHref}
                        data-testid={dataTestId}
                    >
                        {ctaLabel}
                    </Button>
                </Column>
                <Box
                    overflow="hidden"
                    width={getResponsiveValue({
                        default: '500px',
                        laptop: '50%',
                        tablet: 'auto',
                    })}
                    height={getResponsiveValue({
                        default: '100%',
                        tablet: '200px',
                    })}
                    margin={getResponsiveValue({
                        default: 0,
                        tablet: 12,
                    })}
                    borderRadius={getResponsiveValue({
                        default: 0,
                        tablet: 8,
                    })}
                    backgroundColor={getResponsiveValue<Color>({
                        default: 'transparent',
                        laptop: imageBackgroundColor,
                        tablet: imageBackgroundColor,
                    })}
                >
                    {image}
                </Box>
            </Flex>
            <CloseButtonContainer>
                <IconButton
                    icon={XIcon}
                    intent="neutral"
                    priority="secondary"
                    size="small"
                    onClick={onClose}
                    tooltip={{ content: <Translation id="TR_CLOSE" /> }}
                />
            </CloseButtonContainer>
        </Box>
    );
};
