import { ReactNode } from 'react';
import styled from 'styled-components';
import { variables, Button } from '@trezor/components';
import { Translation, TrezorLink } from 'src/components/suite';

interface TextColumnProps {
    title?: ReactNode;
    description?: ReactNode;
    buttonLink?: string;
    buttonTitle?: ReactNode;
}

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    text-align: left;
    margin-right: 16px;
    max-width: 500px;
`;

const ButtonLink = styled(Button)`
    max-width: fit-content;

    svg {
        margin-left: 6px;
    }
`;

const Description = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    margin-bottom: 12px;
    margin-top: 12px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    :first-child {
        margin-top: 0px;
    }

    :last-child {
        margin-bottom: 0px;
    }
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const TextColumn = ({ title, description, buttonLink, buttonTitle }: TextColumnProps) => (
    <Wrapper>
        {title && <Title>{title}</Title>}
        {description && <Description>{description}</Description>}
        {buttonLink && (
            <TrezorLink variant="nostyle" href={buttonLink}>
                <ButtonLink
                    variant="tertiary"
                    size="small"
                    icon="EXTERNAL_LINK"
                    iconAlignment="right"
                >
                    {buttonTitle || <Translation id="TR_LEARN_MORE" />}
                </ButtonLink>
            </TrezorLink>
        )}
    </Wrapper>
);
