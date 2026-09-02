import { selectIsSessionAutostopped, toggleAutostopCoinjoinThunk } from '@suite/coinjoin';
import { Translation } from '@suite/intl';
import { useDispatch } from '@suite-common/redux-utils';
import { type AccountKey } from '@suite-common/wallet-types';
import { Checkbox, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

type AutoStopButtonProps = {
    relatedAccountKey: AccountKey;
};

export const AutoStopButton = ({ relatedAccountKey }: AutoStopButtonProps) => {
    const isActivated = useSelector(state => selectIsSessionAutostopped(state, relatedAccountKey));
    const dispatch = useDispatch();

    const handleClick = () => {
        dispatch(toggleAutostopCoinjoinThunk(relatedAccountKey));
    };

    return (
        <Checkbox isChecked={isActivated} onChange={handleClick} verticalAlignment="center">
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_ENABLE_AUTOSTOP_COINJOIN" />
            </Text>
        </Checkbox>
    );
};
