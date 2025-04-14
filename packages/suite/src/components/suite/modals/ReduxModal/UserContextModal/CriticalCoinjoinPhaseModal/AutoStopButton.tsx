import { Checkbox, Text } from '@trezor/components';

import { toggleAutostopCoinjoin } from 'src/actions/wallet/coinjoinAccountActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectIsSessionAutostopped } from 'src/reducers/wallet/coinjoinReducer';

type AutoStopButtonProps = {
    relatedAccountKey: string;
};

export const AutoStopButton = ({ relatedAccountKey }: AutoStopButtonProps) => {
    const isActivated = useSelector(state => selectIsSessionAutostopped(state, relatedAccountKey));
    const dispatch = useDispatch();

    const handleClick = () => {
        dispatch(toggleAutostopCoinjoin(relatedAccountKey));
    };

    return (
        <Checkbox isChecked={isActivated} onClick={handleClick} verticalAlignment="center">
            <Text typographyStyle="hint" variant="tertiary">
                <Translation id="TR_ENABLE_AUTOSTOP_COINJOIN" />
            </Text>
        </Checkbox>
    );
};
