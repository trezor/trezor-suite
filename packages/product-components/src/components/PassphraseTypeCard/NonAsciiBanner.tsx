import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { Banner, Button, Code, Text } from '@trezor/components';
import { BannerVariant } from '@trezor/components/src/components/Banner/types';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';

const ButtonWrapper = styled.div`
    flex-shrink: 0;
    display: flex;
    align-items: center;
`;

const SpecialCharsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin: ${spacingsPx.xxs} 0 0;
    ${typography.label};
    overflow: hidden;
    border-radius: ${borders.radii.xs};
`;

const SpecialChars = styled.div`
    padding: 0 ${spacingsPx.xxs};
    box-shadow: inset 0 0 0 2px #f2f2f2;
    font-family: RobotoMono, 'PixelOperatorMono8', monospace;
    font-weight: 400;
    letter-spacing: 0.1em;
    background-color: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation1};
`;

const SpecialDescription = styled.div`
    background-color: ${({ theme }) => theme.backgroundNeutralDisabled};
    padding: ${spacingsPx.xxs};
    display: flex;
    gap: ${spacingsPx.sm};
    ${typography.label}
`;

type NonAsciiBannerProps = {
    variant: BannerVariant;
};

export const NonAsciiBanner = ({ variant }: NonAsciiBannerProps) => {
    return (
        <Banner variant={variant} color="default" spacingX="xs">
            <Text>
                <FormattedMessage
                    defaultMessage="We recommend using <code>ABC</code>, <code>abc</code>, <code>123</code>, <code>spaces</code> or <code>these special characters</code>"
                    id="TR_PASSPHRASE_NON_ASCII_CHARS"
                    values={{ code: text => <Code>{text}</Code> }}
                />
            </Text>
            <SpecialCharsWrapper>
                <SpecialChars>
                    {'! " # $ % & \\ \' ( ) * +  - . / : ; < = > ? @ [  ] ^ _ ` { | } ~'}
                </SpecialChars>
                <SpecialDescription>
                    <FormattedMessage
                        defaultMessage="Using non-listed special characters risk future compatibility"
                        id="TR_PASSPHRASE_NON_ASCII_CHARS_WARNING"
                    />
                    <ButtonWrapper>
                        {/* TODO: better would be to reuse LearnMoreButton */}
                        <Button
                            href={HELP_CENTER_PASSPHRASE_URL}
                            target="_blank"
                            variant="tertiary"
                            size="tiny"
                            icon="arrowUpRight"
                            iconAlignment="right"
                        >
                            <FormattedMessage id="TR_LEARN_MORE" defaultMessage="Learn" />
                        </Button>
                    </ButtonWrapper>
                </SpecialDescription>
            </SpecialCharsWrapper>
        </Banner>
    );
};
