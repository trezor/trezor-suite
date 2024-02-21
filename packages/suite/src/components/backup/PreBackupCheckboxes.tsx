import styled from 'styled-components';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { CheckItem, Translation } from 'src/components/suite';
import { ConfirmKey, toggleCheckboxByKey } from 'src/actions/backup/backupActions';
import { variables } from '@trezor/components';
import { spacings } from '@trezor/theme';

const CheckboxWrapper = styled.div`
    margin-top: 38px;
    gap: ${spacings.xs};

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        max-width: 100%;
    }
`;

export const PreBackupCheckboxes = () => {
    const backup = useSelector(state => state.backup);

    const dispatch = useDispatch();

    const isChecked = (key: ConfirmKey) => backup.userConfirmed.includes(key);

    return (
        <CheckboxWrapper>
            <CheckItem
                data-test-id="@backup/check-item/has-enough-time"
                onClick={() => dispatch(toggleCheckboxByKey('has-enough-time'))}
                title={<Translation id="TR_I_HAVE_ENOUGH_TIME_TO_DO" />}
                description={<Translation id="TR_ONCE_YOU_BEGIN_THIS_PROCESS" />}
                isChecked={isChecked('has-enough-time')}
            />
            <CheckItem
                data-test-id="@backup/check-item/is-in-private"
                onClick={() => dispatch(toggleCheckboxByKey('is-in-private'))}
                title={<Translation id="TR_I_AM_IN_SAFE_PRIVATE_OR" />}
                description={<Translation id="TR_MAKE_SURE_NO_ONE_CAN_PEEK" />}
                isChecked={isChecked('is-in-private')}
            />
            <CheckItem
                data-test-id="@backup/check-item/understands-what-seed-is"
                onClick={() => dispatch(toggleCheckboxByKey('understands-what-seed-is'))}
                title={<Translation id="TR_I_UNDERSTAND_SEED_IS_IMPORTANT" />}
                description={<Translation id="TR_BACKUP_SEED_IS_ULTIMATE" />}
                isChecked={isChecked('understands-what-seed-is')}
            />
        </CheckboxWrapper>
    );
};
