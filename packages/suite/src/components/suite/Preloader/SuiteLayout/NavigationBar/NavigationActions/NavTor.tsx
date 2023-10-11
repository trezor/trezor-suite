import styled from 'styled-components';

import { Translation } from 'src/components/suite';
import { ActionItem, IndicatorStatus } from './ActionItem';
import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';

const Wrapper = styled.div`
    position: relative;
    margin-left: 8px;
`;

interface NavTorProps {
    indicator?: IndicatorStatus;
}

export const NavTor = ({ indicator }: NavTorProps) => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('settings-index', { anchor: SettingsAnchor.Tor }));

    return (
        <Wrapper>
            <ActionItem
                label={<Translation id="TR_TOR" />}
                icon="TOR"
                indicator={indicator}
                onClick={handleClick}
            />
        </Wrapper>
    );
};
