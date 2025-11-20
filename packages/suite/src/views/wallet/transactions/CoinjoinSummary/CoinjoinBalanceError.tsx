import styled from 'styled-components';

import { TranslationKey } from '@suite-common/intl-types';
import { typography } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';

const StyledBalanceContainer = styled.div`
    padding: 0 24px;
`;

const Heading = styled.p<{ $color?: string }>`
    margin-bottom: 4px;
    color: ${({ theme, color }) => color || theme.textSubdued};
    ${typography.label}
`;

const SubHeading = styled.p`
    max-width: 480px;
    margin-top: 6px;
    ${typography.titleSmall}
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
