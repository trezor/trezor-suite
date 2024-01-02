import styled from 'styled-components';

import { Translation } from 'src/components/suite';
import { ActionItem } from './ActionItem';
import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { variables } from '@trezor/components';

const Wrapper = styled.div`
    margin-left: 8px;
    position: relative;
    z-index: ${variables.Z_INDEX.ONBOARDING_FOREGROUND};
`;

interface NavSettingsProps {
    isActive?: boolean;
}

export const NavSettings = ({ isActive }: NavSettingsProps) => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('settings-index'));

    return (
        <Wrapper>
            <ActionItem
                data-test="@suite/menu/settings"
                label={<Translation id="TR_SETTINGS" />}
                icon="SETTINGS"
                isActive={isActive}
                onClick={handleClick}
            />
        </Wrapper>
    );
};
