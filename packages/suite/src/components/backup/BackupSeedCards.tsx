import { Column, Grid, Icon, Paragraph, RadioCard } from '@trezor/components';

import { ConfirmKey, toggleCheckboxByKey } from 'src/actions/backup/backupActions';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';

const items = [
    {
        key: 'wrote-seed-properly',
        label: <Translation id="TR_BACKUP_CHECKBOX_1_TITLE" />,
        icon: 'key',
    },
    {
        key: 'made-no-digital-copy',
        label: <Translation id="TR_BACKUP_CHECKBOX_2_TITLE" />,
        icon: 'pencilLine',
    },
    {
        key: 'will-hide-seed',
        label: <Translation id="TR_BACKUP_CHECKBOX_3_TITLE" />,
        icon: 'anchor',
    },
] as const;

export const BackupSeedCards = () => {
    const backup = useSelector(state => state.backup);
    const dispatch = useDispatch();
    const { isBelowTablet } = useLayoutSize();

    const isChecked = (key: ConfirmKey) => backup.userConfirmed.includes(key);

    return (
        <Column gap={16}>
            <Paragraph typographyStyle="hint" variant="tertiary" align="center">
                <Translation id="TR_ONBOARDING_CLICK_TO_CONFIRM" />
            </Paragraph>
            <Grid columns={isBelowTablet ? 1 : 3} gap={16}>
                {items.map(item => (
                    <RadioCard
                        key={item.key}
                        isActive={isChecked(item.key)}
                        onClick={() => dispatch(toggleCheckboxByKey(item.key))}
                        dataTestId={`@backup/check-item/${item.key}`}
                    >
                        <Column gap={16}>
                            <Icon name={item.icon} />
                            <Paragraph typographyStyle="hint" variant="tertiary" textWrap="pretty">
                                {item.label}
                            </Paragraph>
                        </Column>
                    </RadioCard>
                ))}
            </Grid>
        </Column>
    );
};
