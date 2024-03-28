import { Checkbox } from '@trezor/components';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { setDebugMode } from 'src/actions/suite/suiteActions';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';

export const ViewOnly = () => {
    const isViewOnlyModeVisible = useSelector(
        state => state.suite.settings.debug.isViewOnlyModeVisible,
    );
    const dispatch = useDispatch();

    return (
        <SectionItem>
            <TextColumn title={`Show redesigned view-only`} />
            <ActionColumn>
                <Checkbox
                    isChecked={isViewOnlyModeVisible}
                    onClick={() => {
                        dispatch(setDebugMode({ isViewOnlyModeVisible: !isViewOnlyModeVisible }));
                    }}
                />
            </ActionColumn>
        </SectionItem>
    );
};
