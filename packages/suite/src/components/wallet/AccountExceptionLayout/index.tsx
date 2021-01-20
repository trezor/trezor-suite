import React from 'react';
import styled from 'styled-components';
import { variables, H2, Button, Card, ButtonProps } from '@trezor/components';
import { Image, ImageProps } from '@suite-components';

const StyledCard = styled(Card)`
    width: 100%;
    align-items: center;
`;

const Title = styled(H2)`
    text-align: center;
    font-weight: 600;
    margin-bottom: 16px;
`;

const Description = styled.span`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: 500;
    text-align: center;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const StyledImage = styled(props => <Image {...props} />)`
    width: auto;
    height: 80px;
    margin-top: 60px;
    margin-bottom: 28px;
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    margin-bottom: 20px;
`;

const ActionButton = styled(Button)`
    min-width: 160px;

    & + & {
        margin-left: 20px;
    }
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: ${props => props.theme.STROKE_GREY};
    margin: 30px 0px 36px 0px;
`;

interface Props {
    title: JSX.Element | string;
    description?: JSX.Element | string;
    image?: ImageProps['image'];
    imageComponent?: JSX.Element;
    actions?: ({ key: React.ReactText } & ButtonProps)[];
    actionComponent?: JSX.Element;
}

const AccountExceptionLayout = (props: Props) => {
    return (
        <StyledCard>
            {props.image && <StyledImage image={props.image} />}
            {props.imageComponent && props.imageComponent}
            <Title>{props.title}</Title>
            <Description>{props.description}</Description>
            {(props.actionComponent || (props.actions && props.actions.length > 0)) && (
                <>
                    <Divider />
                    <Actions>
                        {props.actions?.map(action => (
                            <ActionButton {...action} />
                        ))}
                        {props.actionComponent && props.actionComponent}
                    </Actions>
                </>
            )}
        </StyledCard>
    );
};

export default AccountExceptionLayout;
