import styled from 'styled-components';
import { Image, SuiteThemeColors } from '@trezor/components';
import { OnlineStatus } from 'invity-api';

const Wrapper = styled.div`
    width: 20px;
    height: 20px;
    position: relative;
    margin-right: 4px;
`;

const StyledImage = styled(Image)`
    border-radius: 50%;
`;

interface StatusIndicatorProps {
    onlineStatus: OnlineStatus;
}

const getStatusColor = (onlineStatus: OnlineStatus, theme: SuiteThemeColors) => {
    const statusColors = {
        ONLINE: theme.TYPE_GREEN,
        RECENTLY_ONLINE: theme.TYPE_ORANGE,
        OFFLINE: theme.TYPE_LIGHT_GREY,
    };

    return statusColors[onlineStatus];
};

const StatusIndicator = styled.div<StatusIndicatorProps>`
    position: absolute;
    top: 0;
    left: 14px;
    width: 5px;
    height: 5px;
    border: 3px solid ${({ onlineStatus, theme }) => getStatusColor(onlineStatus, theme)};
    border-radius: 50%;
`;

interface AvatarProps {
    onlineStatus: OnlineStatus;
}

export const Avatar = ({ onlineStatus }: AvatarProps) => (
    <Wrapper>
        <StyledImage image="COINMARKET_AVATAR" />
        <StatusIndicator onlineStatus={onlineStatus} />
    </Wrapper>
);
