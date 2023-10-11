import styled from 'styled-components';

import { Translation } from 'src/components/suite';
import { ActionItem } from './ActionItem';
import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const Wrapper = styled.div`
    margin-left: 8px;
    position: relative;
`;

interface NavEarlyAccessProps {
    marginLeft?: boolean;
    isActive?: boolean;
}

export const NavEarlyAccess = (props: NavEarlyAccessProps) => {
    const dispatch = useDispatch();

    const handleClick = () =>
        dispatch(goto('settings-index', { anchor: SettingsAnchor.EarlyAccess }));

    return (
        <Wrapper {...props}>
            <ActionItem
                label={<Translation id="TR_EARLY_ACCESS_MENU" />}
                icon="EXPERIMENTAL"
                onClick={handleClick}
            />
        </Wrapper>
    );
};
