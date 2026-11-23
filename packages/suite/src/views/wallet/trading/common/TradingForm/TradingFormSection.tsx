import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Badge, Column, Row, Text, commonFocusStyles } from '@trezor/components';
import { getBorderRadiusCssValue } from '@trezor/theme';

export const TRADING_FORM_SECTION_COMPONENT = 'TradingFormSection';

const BadgeButton = styled.button`
    display: inline-flex;
    padding: 0;
    border: none;
    border-radius: ${getBorderRadiusCssValue('full')};
    background: none;
    cursor: pointer;

    &:focus-visible {
        ${commonFocusStyles}
    }
`;

type TradingFormSectionProps = {
    title?: ReactNode;
    errorMessage?: string;
    onErrorClick?: () => void;
    children: ReactNode;
    'data-testid'?: string;
};

export const TradingFormSection = ({
    title,
    errorMessage,
    onErrorClick,
    children,
    'data-testid': dataTestId,
}: TradingFormSectionProps) => {
    const errorBadge = !!errorMessage && (
        <Badge intent="critical" size="small" data-testid={dataTestId && `${dataTestId}/error`}>
            {errorMessage}
        </Badge>
    );

    return (
        <Column
            gap={8}
            padding={{ horizontal: 20, vertical: 16 }}
            alignItems="stretch"
            data-testid={dataTestId}
            data-component={TRADING_FORM_SECTION_COMPONENT}
        >
            {!!title && (
                <Row gap={8} justifyContent="space-between" alignItems="center">
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        {title}
                    </Text>
                    {errorBadge && onErrorClick ? (
                        <BadgeButton type="button" onClick={onErrorClick}>
                            {errorBadge}
                        </BadgeButton>
                    ) : (
                        errorBadge
                    )}
                </Row>
            )}
            <Column gap={4} alignItems="stretch">
                {children}
            </Column>
        </Column>
    );
};
