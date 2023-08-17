import { useCallback } from 'react';
import styled from 'styled-components';
import { NotificationCard, Translation } from 'src/components/suite';
import { SavingsTrade } from 'invity-api';
import { submitRequestForm } from 'src/utils/suite/env';

const StyledNotificationCard = styled(NotificationCard)`
    padding: 20px;
`;

interface CoinmarketReauthorizationCardProps {
    reauthorizationUrl: SavingsTrade['reauthorizationUrl'];
}

export const CoinmarketReauthorizationCard = ({
    reauthorizationUrl,
}: CoinmarketReauthorizationCardProps) => {
    const handleSubmit = useCallback(() => {
        if (reauthorizationUrl) {
            submitRequestForm('GET', reauthorizationUrl, '_self', {});
        }
    }, [reauthorizationUrl]);

    return (
        <StyledNotificationCard
            variant="critical"
            button={{
                type: 'button',
                children: <Translation id="TR_SAVINGS_AUTHORIZATION_ERROR_BUTTON_LABEL" />,
                variant: 'destructive',
                onClick: handleSubmit,
            }}
        >
            <Translation id="TR_SAVINGS_AUTHORIZATION_ERROR" />
        </StyledNotificationCard>
    );
};
