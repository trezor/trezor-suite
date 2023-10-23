import { ReactNode } from 'react';
import styled from 'styled-components';
import { Image, ImageType, Paragraph, variables } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';

const StyledImage = styled(Image)`
    margin: -8px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        grid-column: 1;
        grid-row: 1/3;
        margin: 0;
    }
`;

const StepNumber = styled(Paragraph)`
    margin: 24px 0 6px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        grid-column: 2;
        grid-row: 1;
    }
`;

const StepTitle = styled(Paragraph)`
    margin-bottom: 20px;
    font-size: ${variables.FONT_SIZE.H3};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        align-self: center;
        font-size: ${variables.FONT_SIZE.BIG};
        grid-column: 2;
        grid-row: 1;
    }
`;

const StepDescription = styled(Paragraph)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        grid-column: 2;
        grid-row: 2;
    }
`;

const Container = styled.div`
    position: relative;
    max-width: 220px;

    :not(:last-child) {
        margin-right: 15px;
    }

    & + & {
        margin-left: 15px;

        ::before {
            content: '';
            position: absolute;
            bottom: 0;
            left: -15px;
            width: 1px;
            height: 130px;
            background: ${({ theme }) => theme.STROKE_GREY};
        }
    }

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        display: grid;
        grid-template-columns: 50px auto;
        gap: 0 14px;
        max-width: unset;

        :not(:last-child) {
            margin-right: 0;
            margin-bottom: 26px;
        }

        & + & {
            margin-left: 0;

            ::before {
                content: none;
            }
        }
    }
`;

export interface CoinjoinProcessStepProps {
    number: number;
    image: ImageType;
    title: ReactNode;
    description: ReactNode;
}

export const CoinjoinProcessStep = ({
    number,
    image,
    title,
    description,
}: CoinjoinProcessStepProps) => (
    <Container>
        <StyledImage image={image} width={80} />
        <StepNumber>
            <Translation id="TR_STEP" values={{ number }} />
        </StepNumber>
        <StepTitle>{title}</StepTitle>
        <StepDescription>{description}</StepDescription>
    </Container>
);
