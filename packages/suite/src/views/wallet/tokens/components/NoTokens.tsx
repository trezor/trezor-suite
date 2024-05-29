import { Button } from '@trezor/components';
import { AccountExceptionLayout } from 'src/components/wallet';
import { Translation } from 'src/components/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

export const NoTokens = () => {
    const isDebug = useSelector(selectIsDebugModeActive);
    const dispatch = useDispatch();

    const handleButtonClick = () => dispatch(openModal({ type: 'add-token' }));

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_TOKENS_EMPTY" />}
            image="CLOUDY"
            actionComponent={
                isDebug ? (
                    <Button variant="primary" onClick={handleButtonClick}>
                        <Translation id="TR_TOKENS_ADD" />
                    </Button>
                ) : undefined
            }
        />
    );
};
