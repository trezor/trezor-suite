import styled from 'styled-components';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { CheckItem, Translation } from 'src/components/suite';
import { ConfirmKey, toggleCheckboxByKey } from 'src/actions/backup/backupActions';
import { spacings } from '@trezor/theme';

const CheckboxWrapper = styled.div`
    margin-top: 38px;
    gap: ${spacings.xs};
`;

export const AfterBackupCheckboxes = () => {
    const backup = useSelector(state => state.backup);

    const dispatch = useDispatch();

    const isChecked = (key: ConfirmKey) => backup.userConfirmed.includes(key);

    return (
        <CheckboxWrapper>
            <CheckItem
                data-test="@backup/check-item/wrote-seed-properly"
                onClick={() => dispatch(toggleCheckboxByKey('wrote-seed-properly'))}
                title={<Translation id="TR_BACKUP_CHECKBOX_1_TITLE" />}
                description={<Translation id="TR_BACKUP_CHECKBOX_1_DESCRIPTION" />}
                isChecked={isChecked('wrote-seed-properly')}
            />
            <CheckItem
                data-test="@backup/check-item/made-no-digital-copy"
                onClick={() => dispatch(toggleCheckboxByKey('made-no-digital-copy'))}
                title={<Translation id="TR_BACKUP_CHECKBOX_2_TITLE" />}
                description={<Translation id="TR_BACKUP_CHECKBOX_2_DESCRIPTION" />}
                isChecked={isChecked('made-no-digital-copy')}
            />
            <CheckItem
                data-test="@backup/check-item/will-hide-seed"
                onClick={() => dispatch(toggleCheckboxByKey('will-hide-seed'))}
                title={<Translation id="TR_BACKUP_CHECKBOX_3_TITLE" />}
                description={<Translation id="TR_BACKUP_CHECKBOX_3_DESCRIPTION" />}
                isChecked={isChecked('will-hide-seed')}
            />
        </CheckboxWrapper>
    );
};
