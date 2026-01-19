import { Switch } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';

import { setFlag } from '../../../actions/suite/suiteActions';

export const AnalyticsDebugging = () => {
    const dispatch = useDispatch();
    const { isAnalyticsDebuggingEnabled } = useSelector(selectSuiteFlags);
    const toggleAnalytics = (isChecked: boolean) =>
        dispatch(setFlag('isAnalyticsDebuggingEnabled', isChecked));

    return (
        <>
            <SectionItem>
                <TextColumn title="Analytics" description="Debug analytics in console" />
                <ActionColumn>
                    <Switch onChange={toggleAnalytics} isChecked={isAnalyticsDebuggingEnabled} />
                </ActionColumn>
            </SectionItem>
        </>
    );
};
