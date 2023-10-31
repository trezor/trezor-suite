import styled from 'styled-components';

import { ConfirmKey, toggleCheckboxByKey } from 'src/actions/backup/backupActions';
import { Translation } from 'src/components/suite/Translation';
import { variables } from '@trezor/components';
import { useSelector, useDispatch } from 'src/hooks/suite';
import { BackupSeedCard } from './BackupSeedCard';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const Instructions = styled.div`
    text-align: center;
    margin: 16px 0 26px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Items = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    width: 100%;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        grid-template-columns: 1fr;
    }
`;

const StyledBackupSeedCard = styled(BackupSeedCard)`
    width: 30%;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
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

export const BackupSeedCards = () => {
    const backup = useSelector(state => state.backup);

    const dispatch = useDispatch();

    const isChecked = (key: ConfirmKey) => backup.userConfirmed.includes(key);

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
                        onClick={() => dispatch(toggleCheckboxByKey(item.key))}
                        label={item.label}
                        icon={item.icon}
                        isChecked={isChecked(item.key)}
                    />
                ))}
            </Items>
        </Wrapper>
    );
};
