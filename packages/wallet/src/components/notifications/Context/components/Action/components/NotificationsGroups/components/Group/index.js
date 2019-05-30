import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { colors, Notification, Icon, icons as ICONS } from 'trezor-ui-components';
import { getIcon, getPrimaryColor } from 'utils/notification';

const Wrapper = styled.div``;

const Header = styled.div`
    display: flex;
    cursor: pointer;
    justify-content: space-between;
    background: ${colors.WHITE};
    align-items: center;
    padding: 5px 10px;
    border-bottom: 1px solid ${colors.BACKGROUND};
`;

const Left = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
`;

const Right = styled.div``;
const Body = styled.div``;

const Title = styled.div`
    color: ${props => props.color};
`;

const StyledNotification = styled(Notification)`
    border-bottom: 1px solid ${colors.WHITE};

    &:last-child {
        border: 0;
    }
`;

const StyledIcon = styled(Icon)`
    margin-right: 6px;
`;

class Group extends PureComponent {
    constructor() {
        super();
        this.state = {
            visibleCount: 1,
            visible: true,
        };
    }

    toggle = () => {
        if (this.state.visible) {
            this.setState({
                visible: false,
                visibleCount: this.props.groupNotifications.length,
            });
        } else {
            this.setState({
                visible: true,
                visibleCount: 0,
            });
        }
    };

    render() {
        const { variant, groupNotifications, close } = this.props;
        const color = getPrimaryColor(variant);
        return (
            <Wrapper>
                {groupNotifications.length > 1 && (
                    <Header onClick={this.toggle}>
                        <Left>
                            <StyledIcon color={color} size={16} icon={getIcon(variant)} />
                            <Title color={color}>
                                {groupNotifications.length}{' '}
                                {groupNotifications.length > 1 ? `${variant}s` : variant}
                            </Title>
                        </Left>
                        <Right>
                            <Icon
                                icon={ICONS.ARROW_DOWN}
                                color={colors.TEXT_SECONDARY}
                                size={14}
                                isActive={!this.state.visible}
                                canAnimate
                            />
                        </Right>
                    </Header>
                )}
                <Body>
                    {groupNotifications.slice(0, this.state.visibleCount).map(notification => (
                        <StyledNotification
                            key={notification.key}
                            variant={notification.variant}
                            title={notification.title}
                            message={notification.message}
                            cancelable={notification.cancelable}
                            actions={notification.actions}
                            close={close}
                        />
                    ))}
                </Body>
            </Wrapper>
        );
    }
}

Group.propTypes = {
    variant: PropTypes.string,
    close: PropTypes.func.isRequired,
    groupNotifications: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.object,
            type: PropTypes.string,
            title: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.node,
                PropTypes.shape({
                    id: PropTypes.string,
                    defaultMessage: PropTypes.string,
                    description: PropTypes.string,
                    values: PropTypes.object,
                }),
            ]),
            message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
        })
    ),
};

export default Group;
