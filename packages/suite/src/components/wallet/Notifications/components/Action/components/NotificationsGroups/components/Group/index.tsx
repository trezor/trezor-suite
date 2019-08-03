import React, { PureComponent } from 'react';
import styled from 'styled-components';
import { colors, Notification, Icon, icons as ICONS, utils } from '@trezor/components';
import { NotificationEntry } from '@wallet-reducers/notificationReducer';

const { getPrimaryColor } = utils.colors;
const { getStateIcon } = utils.icons;

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

const Title = styled.div<{ color: string }>`
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

// TODO
interface Props {
    variant: 'error' | 'success' | 'info' | 'warning';
    close: () => any;
    groupNotifications: NotificationEntry[];
}

interface StateProps {
    visible: boolean;
    visibleCount: number;
}

class Group extends PureComponent<Props, StateProps> {
    constructor(props: Props) {
        super(props);
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
        const stateIcon = getStateIcon(variant);
        if (!color || !stateIcon) return null;

        return (
            <Wrapper>
                {groupNotifications.length > 1 && (
                    <Header onClick={this.toggle}>
                        <Left>
                            <StyledIcon color={color} size={16} icon={stateIcon} />
                            <Title color={color}>
                                {groupNotifications.length}{' '}
                                {groupNotifications.length > 1 ? `${variant}s` : variant}
                            </Title>
                        </Left>
                        <Right>
                            <Icon
                                icon="ARROW_DOWN"
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

export default Group;
