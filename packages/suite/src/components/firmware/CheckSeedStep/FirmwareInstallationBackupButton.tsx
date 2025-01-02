import { useFirmwareInstallation } from '@suite-common/firmware';
import { Button } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

type FirmwareInstallationBackupButtonProps = {
    isBackedUp: boolean;
};

export const FirmwareInstallationBackupButton = ({
    isBackedUp,
}: FirmwareInstallationBackupButtonProps) => {
    const dispatch = useDispatch();

    const { resetReducer } = useFirmwareInstallation();

    const secondaryButtonText = isBackedUp ? 'TR_CHECK_SEED' : 'TR_CREATE_BACKUP';

    const handleSecondaryButtonClick = () => {
        resetReducer();
        dispatch(goto(isBackedUp ? 'recovery-index' : 'backup-index'));
    };

    return (
        <Button variant="tertiary" onClick={handleSecondaryButtonClick}>
            <Translation id={secondaryButtonText} />
        </Button>
    );
};
