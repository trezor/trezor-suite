import { borders, spacings, spacingsPx, typography } from '@trezor/theme';
import { FormattedMessage } from 'react-intl';
import styled, { useTheme } from 'styled-components';
import { Tooltip, TooltipProps, Column, Row, Icon } from '@trezor/components';
import { WalletType } from './types';
import { ReactNode } from 'react';

const IconWrapper = styled.div<{ $type: WalletType }>`
    width: 38px;
    height: 38px;
    background: ${({ theme, $type }) =>
        $type === 'standard'
            ? theme.backgroundPrimarySubtleOnElevation1
            : theme.backgroundSurfaceElevation1};
    border-radius: ${borders.radii.sm};
    display: flex;
    justify-content: center;
    align-items: center;
`;

const Description = styled.div<{ $hasTopMargin?: boolean }>`
    display: flex;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.label}
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const ArrowCol = styled(Column)`
    flex: 0 0 auto;
    height: 100%;
    justify-content: center;
`;

const WalletTitle = styled.div<{ $withMargin: boolean }>`
    display: flex;
    ${typography.body}
    color: ${({ theme }) => theme.textDefault};
    align-items: center;
    ${props => props.$withMargin && `margin-bottom: ${spacingsPx.xxs};`}
`;

type PassphraseTypeCardHeadingProps = {
    title?: ReactNode;
    description?: ReactNode;
    type: WalletType;
    learnMoreTooltipOnClick?: TooltipProps['addon'];
    learnMoreTooltipAppendTo?: TooltipProps['appendTo'];
};

export const PassphraseTypeCardHeading = ({
    type,
    learnMoreTooltipOnClick,
    learnMoreTooltipAppendTo,
    title,
    description,
}: PassphraseTypeCardHeadingProps) => {
    const theme = useTheme();

    return (
        <Row gap={spacings.xl}>
            <IconWrapper $type={type}>
                {type === 'standard' ? (
                    <Icon size={24} name="standardWallet" color={theme.iconPrimaryDefault} />
                ) : (
                    <Icon size={24} name="lock" color={theme.iconSubdued} />
                )}
            </IconWrapper>
            <Column justifyContent="center" flex="1">
                <WalletTitle
                    $withMargin={type === 'hidden'}
                    data-testid={type === 'hidden' && '@tooltip/passphrase-tooltip'}
                >
                    {type === 'hidden' ? (
                        <Tooltip
                            appendTo={learnMoreTooltipAppendTo}
                            title={<FormattedMessage id="TR_WHAT_IS_PASSPHRASE" />}
                            addon={learnMoreTooltipOnClick}
                            content={<FormattedMessage id="TR_HIDDEN_WALLET_TOOLTIP" />}
                            dashed
                        >
                            <>{title}</>
                        </Tooltip>
                    ) : (
                        title
                    )}
                </WalletTitle>
                <Description>{description}</Description>
            </Column>
            {type === 'standard' && (
                <ArrowCol>
                    <Icon name="caretLeft" color={theme.iconSubdued} />
                </ArrowCol>
            )}
        </Row>
    );
};
