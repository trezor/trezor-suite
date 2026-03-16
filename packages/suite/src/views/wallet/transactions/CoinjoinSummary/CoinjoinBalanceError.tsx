import styled from 'styled-components';

import { Translation, type TranslationKey } from '@suite/intl';
import { typography } from '@trezor/theme';

const StyledBalanceContainer = styled.div`
    padding: 0 24px;
`;

const Heading = styled.p<{ $color?: string }>`
    margin-bottom: 4px;
    color: ${({ theme, color }) => color || theme.textSubdued};
    ${typography['body-xs']}
`;

const SubHeading = styled.p`
    max-width: 480px;
    margin-top: 6px;
    ${typography['headline-sm']}
`;

export interface CoinjoinBalanceErrorProps {
    headingId: TranslationKey;
    messageId: TranslationKey;
    headingColor?: string;
}

export const CoinjoinBalanceError = ({
    headingId,
    messageId,
    headingColor,
}: CoinjoinBalanceErrorProps) => (
    <StyledBalanceContainer>
        <Heading color={headingColor}>
            <Translation id={headingId} />
        </Heading>
        <SubHeading>
            <Translation id={messageId} />
        </SubHeading>
    </StyledBalanceContainer>
);
