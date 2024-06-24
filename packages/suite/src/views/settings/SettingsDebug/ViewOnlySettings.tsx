import { Checkbox } from '@trezor/components';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { setFlag } from 'src/actions/suite/suiteActions';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';

export const ViewOnlySettings = () => {
    const {
        viewOnlyPromoClosed,
        viewOnlyTooltipClosed,
        isViewOnlyModeVisible,
        isDashboardPassphraseBannerVisible,
    } = useSelector(selectSuiteFlags);
    const dispatch = useDispatch();

    return (
        <>
            <SectionItem>
                <TextColumn title="Enable redesigned view-only" />
                <ActionColumn>
                    <Checkbox
                        isChecked={isViewOnlyModeVisible}
                        onClick={() => {
                            dispatch(setFlag('isViewOnlyModeVisible', !isViewOnlyModeVisible));
                        }}
                    />
                </ActionColumn>
            </SectionItem>

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
                <TextColumn title="Set viewOnlyTooltipClosed" />
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
