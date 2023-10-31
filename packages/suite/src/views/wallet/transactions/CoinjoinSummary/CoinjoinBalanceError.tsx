import styled from 'styled-components';
import { variables } from '@trezor/components';
import { TranslationKey } from '@suite-common/intl-types';
import { Translation } from 'src/components/suite/Translation';

const StyledBalanceContainer = styled.div`
    padding: 0 24px;
`;

const Heading = styled.p<{ $color?: string }>`
    margin-bottom: 4px;
    color: ${({ theme, color }) => color || theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const SubHeading = styled.p`
    max-width: 480px;
    margin-top: 6px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.H3};
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
