import { MouseEventHandler } from 'react';
import styled from 'styled-components';

import { Button, Link } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { useTranslation } from 'src/hooks/suite';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
`;

const ButtonWrapper = styled.div`
    position: absolute;
    top: 8px;
    right: 16px;
`;

const ContentWrapper = styled.div`
    flex-grow: 1;
    padding-right: 150px;
`;

type ButtonProps = { onClick: MouseEventHandler<HTMLButtonElement>; text: string };

export type InputErrorProps = {
    buttonProps?: ButtonProps;
    learnMoreUrl?: string;
    message?: string;
};

export const InputError = ({ buttonProps, message, learnMoreUrl }: InputErrorProps) => {
    const { translationString } = useTranslation();

    return (
        <Wrapper>
            <ContentWrapper>
                {message}
                {learnMoreUrl && (
                    <>
                        {' '}
                        <Link
                            href={learnMoreUrl}
                            variant="nostyle"
                            icon="externalLink"
                            type="label"
                        >
                            {translationString('TR_LEARN_MORE')}
                        </Link>
                    </>
                )}
            </ContentWrapper>
            {buttonProps && (
                <ButtonWrapper>
                    <Button size="tiny" variant="tertiary" onClick={buttonProps.onClick}>
                        {buttonProps.text}
                    </Button>
                </ButtonWrapper>
            )}
        </Wrapper>
    );
};
