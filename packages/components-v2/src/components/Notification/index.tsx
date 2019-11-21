import * as React from 'react';
import styled from 'styled-components';
import { FeedbackType } from '../../support/types';
import colors from '../../config/colors';

const Wrapper = styled.div<WrapperProps>`
    display: flex;
    width: ${props => (props.hasCta ? '400px' : '296px')};
    padding: 4px;
    background: ${colors.WHITE};
    border-radius: 6px;
`;

const StateWrapper = styled.div`
    padding-right: 14px;
`;

const State = styled.div<StateProps>`
    display: flex;
    width: 4px;
    height: 100%;
    background: ${colors.GREEN};
    border-radius: 4px;
`;

const ContentWrapper = styled.div`
    padding: 9px 0;
`;

const Title = styled.div``;

const Description = styled.div``;

const CtaWrapper = styled.div``;

const CtaButton = styled.button``;

interface StateProps {
    state: NotificationProps['state'];
}

interface WrapperProps {
    hasCta: boolean;
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
                    {mainCta && <CtaButton></CtaButton>}
                    {secondCta && <CtaButton></CtaButton>}
                </CtaWrapper>
            )}
        </Wrapper>
    );
};

export { Notification };
