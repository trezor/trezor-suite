import { type ReactNode } from 'react';

import { GhostContainer, type GhostContainerProps, Icon, Row, Text } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';

type FormSelectRowProps = Pick<
    GhostContainerProps,
    'children' | 'onClick' | 'isDisabled' | 'data-testid'
> & {
    label: ReactNode;
};

export const FormSelectRow = ({
    label,
    children,
    onClick,
    isDisabled = false,
    'data-testid': dataTestId,
}: FormSelectRowProps) => (
    <GhostContainer
        onClick={onClick}
        isDisabled={isDisabled}
        borderRadius={0}
        data-testid={dataTestId}
    >
        <Row
            justifyContent="space-between"
            alignItems="center"
            gap={16}
            padding={{ vertical: 20, horizontal: 16 }}
        >
            <Text typographyStyle="body-sm" align="start" intent="neutral" priority="secondary">
                {label}
            </Text>
            <Row gap={16} alignItems="center">
                <Text
                    typographyStyle="body-sm"
                    as="div"
                    data-testid={dataTestId && `${dataTestId}/value`}
                >
                    {children}
                </Text>
                <Icon as={CaretRightIcon} size={16} intent="neutral" priority="secondary" />
            </Row>
        </Row>
    </GhostContainer>
);
