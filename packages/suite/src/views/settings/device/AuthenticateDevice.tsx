import { openModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { useDispatch } from 'src/hooks/suite';

export const AuthenticateDevice = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(openModal({ type: 'authenticate-device' }));

    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_CHECK_DEVICE_ORIGIN_TITLE" />}
                description={<Translation id="TR_CHECK_DEVICE_ORIGIN_DESCRIPTION" />}
            />
            <ActionColumn>
                <ActionButton variant="secondary" onClick={handleClick}>
                    <Translation id="TR_CHECK_ORIGIN" />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
