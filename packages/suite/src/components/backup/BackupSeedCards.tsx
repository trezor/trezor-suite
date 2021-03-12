import React from 'react';
import styled from 'styled-components';

import * as backupActions from '@suite/actions/backup/backupActions';
import { Translation } from '@suite-components/Translation';
import { variables } from '@trezor/components';
import { useActions, useSelector } from '@suite/hooks/suite';
import BackupSeedCard from './BackupSeedCard';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const Instructions = styled.div`
    text-align: center;
    margin: 26px 0px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Items = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: column;
    }
`;

const StyledBackupSeedCard = styled(BackupSeedCard)`
    width: 30%;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 100%;
        & + & {
            margin-top: 10px;
        }
    }
`;

const items = [
    {
        key: 'wrote-seed-properly',
        label: <Translation id="TR_BACKUP_CHECKBOX_1_TITLE" />,
        icon: 'KEY',
    },
    {
        key: 'made-no-digital-copy',
        label: <Translation id="TR_BACKUP_CHECKBOX_2_TITLE" />,
        icon: 'PENCIL_LINE',
    },
    {
        key: 'will-hide-seed',
        label: <Translation id="TR_BACKUP_CHECKBOX_3_TITLE" />,
        icon: 'ANCHOR',
    },
] as const;

const BackupSeedCards = () => {
    const backup = useSelector(s => s.backup);
    const { toggleCheckboxByKey } = useActions({
        toggleCheckboxByKey: backupActions.toggleCheckboxByKey,
    });

    const isChecked = (key: backupActions.ConfirmKey) => backup.userConfirmed.includes(key);

    return (
        <Wrapper>
            <Instructions>
                <Translation id="TR_ONBOARDING_CLICK_TO_CONFIRM" />
            </Instructions>
            <Items>
                {items.map(item => (
                    <StyledBackupSeedCard
                        // TODO: change data-test, checkbox keys to something more generic, independent of actual content
                        data-test={`@backup/check-item/${item.key}`}
                        key={item.key}
                        onClick={() => toggleCheckboxByKey(item.key)}
                        label={item.label}
                        icon={item.icon}
                        isChecked={isChecked(item.key)}
                    />
                ))}
            </Items>
        </Wrapper>
    );
};

export default BackupSeedCards;
