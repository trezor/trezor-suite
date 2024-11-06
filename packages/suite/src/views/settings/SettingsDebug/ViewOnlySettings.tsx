import { Checkbox } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { setFlag } from 'src/actions/suite/suiteActions';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';

export const ViewOnlySettings = () => {
    const { viewOnlyPromoClosed, viewOnlyTooltipClosed, isDashboardPassphraseBannerVisible } =
        useSelector(selectSuiteFlags);
    const dispatch = useDispatch();

    return (
        <>
            <SectionItem>
                <TextColumn title="Set viewOnlyPromoClosed" />
                <ActionColumn>
                    <Checkbox
                        isChecked={viewOnlyPromoClosed}
                        onClick={() => {
                            dispatch(setFlag('viewOnlyPromoClosed', !viewOnlyPromoClosed));
                        }}
                    />
                </ActionColumn>
            </SectionItem>

            <SectionItem>
                <TextColumn
                    title="Set viewOnlyTooltipClosed"
                    description="To show tooltip in the app you also need to set viewOnlyPromoClosed = true"
                />
                <ActionColumn>
                    <Checkbox
                        isChecked={viewOnlyTooltipClosed}
                        onClick={() => {
                            dispatch(setFlag('viewOnlyTooltipClosed', !viewOnlyTooltipClosed));
                        }}
                    />
                </ActionColumn>
            </SectionItem>

            <SectionItem>
                <TextColumn title="Set isDashboardPassphraseBannerVisible" />
                <ActionColumn>
                    <Checkbox
                        isChecked={isDashboardPassphraseBannerVisible}
                        onClick={() => {
                            dispatch(
                                setFlag(
                                    'isDashboardPassphraseBannerVisible',
                                    !isDashboardPassphraseBannerVisible,
                                ),
                            );
                        }}
                    />
                </ActionColumn>
            </SectionItem>
        </>
    );
};
