import * as React from 'react';
import styled, { css } from 'styled-components';
import { FeedbackType } from '../../support/types';
import colors from '../../config/colors';
import { getFeedbackColor } from '../../utils/colors';

const Wrapper = styled.div<WrapperProps>`
    display: flex;
    width: ${props => (props.hasCta ? '400px' : '296px')};
    padding: 4px;
    background: ${colors.WHITE};
    border-radius: 6px;
`;

const StateWrapper = styled.div`
    padding-right: 12px;
`;

const State = styled.div<StateProps>`
    display: flex;
    width: 4px;
    height: 100%;
    background: ${props => getFeedbackColor(props.state || 'success')};
    border-radius: 4px;
`;

const ContentWrapper = styled.div`
    width: 282px;
    padding: 9px 10px 9px 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const Title = styled.div`
    font-weight: 600;
    color: ${colors.BLACK25};
`;

const Description = styled.div`
    font-size: 12px;
    color: ${colors.BLACK50};
    margin-top: 6px;
`;

const CtaWrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin: -4px -4px -4px 0;
    width: 104px;
    border-radius: 0 6px 6px 0;
    overflow: hidden;
    justify-content: center;
    border-left: 2px solid ${colors.BLACK96};
`;

const CtaButton = styled.button<CtaProps>`
    flex: 1;
    border: none;
    outline: none;
    min-height: 36px;
    cursor: pointer;
    color: ${colors.BLACK25};

    &:hover {
        text-decoration: underline;
    }

    ${props =>
        props.isMain &&
        css`
            font-weight: 600;
        `}

    + button {
        border-top: 2px solid ${colors.BLACK96};
    }
`;

const CtaLoading = styled.div`
    font-size: 12px;
    color: ${colors.BLACK50};
    text-align: center;
`;

interface StateProps {
    state: NotificationProps['state'];
}

interface WrapperProps {
    hasCta: boolean;
}

interface CtaProps {
    isMain?: boolean;
}

interface CtaShape {
    label: React.ReactNode | string;
    callback: () => any;
}

interface NotificationProps {
    title: string;
    description?: string;
    isLoading?: boolean;
    mainCta?: CtaShape;
    secondCta?: CtaShape;
    state?: FeedbackType;
    dataTest?: string;
}

const Notification = ({
    title,
    description,
    isLoading,
    mainCta,
    secondCta,
    state = 'success',
    dataTest,
}: NotificationProps) => {
    return (
        <Wrapper data-test={dataTest} hasCta={!!(mainCta || isLoading)}>
            <StateWrapper>
                <State state={state}></State>
            </StateWrapper>
            <ContentWrapper>
                <Title>{title}</Title>
                {description && <Description>{description}</Description>}
            </ContentWrapper>
            {(mainCta || isLoading) && (
                <CtaWrapper>
                    {!isLoading && mainCta && (
                        <CtaButton onClick={mainCta.callback} isMain>
                            {mainCta.label}
                        </CtaButton>
                    )}
                    {!isLoading && secondCta && (
                        <CtaButton onClick={secondCta.callback}>{secondCta.label}</CtaButton>
                    )}
                    {isLoading && <CtaLoading>loading...</CtaLoading>}
                </CtaWrapper>
            )}
        </Wrapper>
    );
};

export { Notification };
