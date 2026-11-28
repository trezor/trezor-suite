import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Button, Column, IconCircle, Text } from '@trezor/components';
import { CheckIcon } from '@trezor/icons';

import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';

type EarnFlowCompleteProps = {
    heading: ReactNode;
    description: ReactNode;
    onBack: () => void;
    headingTestId?: string;
    descriptionTestId?: string;
    backButtonTestId?: string;
    feedback?: ReactNode;
    children: ReactNode;
    'data-testid'?: string;
};

export const EarnFlowComplete = ({
    heading,
    description,
    onBack,
    headingTestId,
    descriptionTestId,
    backButtonTestId,
    feedback,
    children,
    'data-testid': dataTestId,
}: EarnFlowCompleteProps) => {
    const { isBelowMobile } = useLayoutSize();

    return (
        <Column gap={16} data-testid={dataTestId}>
            <IconCircle icon={CheckIcon} intent="brand" size={isBelowMobile ? 64 : 96} />

            <Column gap={4}>
                <Text typographyStyle="headline-md" data-testid={headingTestId}>
                    {heading}
                </Text>

                <Text intent="neutral" priority="secondary" data-testid={descriptionTestId}>
                    {description}
                </Text>
            </Column>

            {children}

            <Button
                intent="neutral"
                priority="secondary"
                data-testid={backButtonTestId}
                onClick={onBack}
            >
                <Translation id="TR_EARN_BACK_TO_OVERVIEW" />
            </Button>

            {feedback}
        </Column>
    );
};
