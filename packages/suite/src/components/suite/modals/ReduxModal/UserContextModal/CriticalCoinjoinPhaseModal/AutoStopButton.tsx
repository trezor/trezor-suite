import { Translation } from '@suite/intl';
import { type AccountKey } from '@suite-common/wallet-types';
import { Checkbox, Text } from '@trezor/components';

import { toggleAutostopCoinjoin } from 'src/actions/wallet/coinjoinAccountActions';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectIsSessionAutostopped } from 'src/reducers/wallet/coinjoinReducer';

type AutoStopButtonProps = {
    relatedAccountKey: AccountKey;
};

export const AutoStopButton = ({ relatedAccountKey }: AutoStopButtonProps) => {
    const isActivated = useSelector(state => selectIsSessionAutostopped(state, relatedAccountKey));
    const dispatch = useDispatch();

    const handleClick = () => {
        dispatch(toggleAutostopCoinjoin(relatedAccountKey));
    };

    return (
        <Checkbox isChecked={isActivated} onChange={handleClick} verticalAlignment="center">
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_ENABLE_AUTOSTOP_COINJOIN" />
            </Text>
        </Checkbox>
    );
};
