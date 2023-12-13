import styled, { useTheme } from 'styled-components';

import { Icon, Tooltip } from '@trezor/components';
import { HoverAnimation, Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { borders } from '@trezor/theme';

const Wrapper = styled.div`
    width: 44px;
    height: 44px;
    display: flex;
    position: relative;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    border-radius: ${borders.radii.xs};
    transition: ${({ theme }) =>
        `background ${theme.HOVER_TRANSITION_TIME} ${theme.HOVER_TRANSITION_EFFECT}`};
`;

interface NavSettingsProps {
    isActive?: boolean;
}

export const NavSettings = ({ isActive }: NavSettingsProps) => {
    const dispatch = useDispatch();
    const theme = useTheme();

    const handleClick = () => dispatch(goto('settings-index'));

    return (
        <Tooltip
            cursor="default"
            maxWidth={200}
            delay={[600, 0]}
            placement="bottom"
            interactive={false}
            hideOnClick={false}
            content={<Translation id="TR_SETTINGS" />}
        >
            <HoverAnimation>
                <Wrapper data-test="@suite/menu/settings" onClick={handleClick}>
                    <Icon
                        color={isActive ? theme.TYPE_DARK_GREY : theme.TYPE_LIGHT_GREY}
                        size={24}
                        icon="SETTINGS"
                    />
                </Wrapper>
            </HoverAnimation>
        </Tooltip>
    );
};
