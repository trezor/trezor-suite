import { useState, useCallback, ReactNode, ChangeEvent } from 'react';
import styled, { css } from 'styled-components';
import { analytics, EventType } from '@trezor/suite-analytics';
import { getFirmwareVersion } from '@trezor/device-utils';

import { Translation } from 'src/components/suite';
import { Textarea, Select, variables, Button, CollapsibleBox } from '@trezor/components';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { sendFeedback, setView } from 'src/actions/suite/guideActions';
import { GuideViewWrapper, GuideHeader, GuideContent } from 'src/components/guide';
import { Rating, FeedbackCategory, FeedbackType, UserData } from '@suite-common/suite-types';
import {
    getEnvironment,
    getUserAgent,
    getWindowHeight,
    getWindowWidth,
    getOsName,
    getCommitHash,
    getSuiteVersion,
} from '@trezor/env-utils';

const Headline = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-align: left;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    padding: 0 0 11px;
    width: 100%;
`;

const Submit = styled(Button)`
    width: 100%;
    margin: 0 0 20px;
`;

const SelectWrapper = styled.div`
    padding: 0 0 20px;
`;

const RatingWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 0 0 20px;
`;

const RatingItem = styled.button<{ selected?: boolean }>`
    width: 48px;
    height: 47px;
    padding-top: 1px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    cursor: pointer;
    font-size: 30px;
    background-color: inherit;

    ${({ selected, theme }) =>
        selected &&
        css`
            background: ${theme.BG_GREEN};
            border: 1px solid ${theme.BG_GREEN};

            &:hover {
                background: ${theme.BG_GREEN};
            }
        `};
`;

const AnonymousDataList = styled.ul`
    margin-left: 20px;
`;

const AnonymousDataItem = styled.li`
    margin-bottom: 4px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

type RatingItem = {
    id: Rating;
    value: ReactNode;
};

const MESSAGE_CHARACTER_LIMIT = 1000;
const ratingOptions: RatingItem[] = [
    {
        id: '1',
        value: <>&#128545;</>,
    },
    {
        id: '2',
        value: <>&#128533;</>,
    },
    {
        id: '3',
        value: <>&#128529;</>,
    },
    {
        id: '4',
        value: <>&#128522;</>,
    },
    {
        id: '5',
        value: <>&#128525;</>,
    },
];

/** A format compatible with React Select component. */
type FeedbackCategoryOption = {
    label: ReactNode;
    value: FeedbackCategory;
};

type FeedbackProps = {
    type: FeedbackType;
};

export const Feedback = ({ type }: FeedbackProps) => {
    const { device } = useDevice();
    const dispatch = useDispatch();
    const router = useSelector(state => state.router);
    const [description, setDescription] = useState('');
    const [rating, setRating] = useState<RatingItem>();

    const feedbackCategories: { [key in FeedbackCategory]: ReactNode } = {
        dashboard: <Translation id="TR_FEEDBACK_CATEGORY_DASHBOARD" />,
        account: <Translation id="TR_FEEDBACK_CATEGORY_ACCOUNT" />,
        settings: <Translation id="TR_FEEDBACK_CATEGORY_SETTINGS" />,
        send: <Translation id="TR_FEEDBACK_CATEGORY_SEND" />,
        receive: <Translation id="TR_FEEDBACK_CATEGORY_RECEIVE" />,
        trade: <Translation id="TR_FEEDBACK_CATEGORY_TRADE" />,
        other: <Translation id="TR_FEEDBACK_CATEGORY_OTHER" />,
    };

    // Router apps does not match 1:1 to Feedback Categories
    const getDefaultCategory = (): FeedbackCategory | undefined => {
        const { app, route } = router;
        const routePattern = route?.pattern || '';

        if (routePattern.startsWith('/accounts/coinmarket')) {
            return 'trade';
        }
        if (routePattern.startsWith('/accounts/send')) {
            return 'send';
        }
        if (routePattern.startsWith('/accounts/receive')) {
            return 'receive';
        }

        switch (app) {
            case 'dashboard':
                return 'dashboard';
            case 'wallet':
                return 'account';
            case 'settings':
                return 'settings';
            default:
                return undefined;
        }
    };
    const [category, setCategory] = useState(getDefaultCategory());

    const categoryToOption = (category: FeedbackCategory): FeedbackCategoryOption => ({
        value: category,
        label: feedbackCategories[category],
    });

    const goBack = () => dispatch(setView('SUPPORT_FEEDBACK_SELECTION'));
    const onSubmit = useCallback(() => {
        const userData: UserData = {
            platform: getEnvironment(),
            os: getOsName(),
            user_agent: getUserAgent(),
            suite_version: getSuiteVersion(),
            suite_revision: getCommitHash(),
            window_dimensions: `${getWindowWidth()}x${getWindowHeight()}`,
            device_model: device?.features?.internal_model,
            firmware_version: device?.features ? getFirmwareVersion(device) : '',
            firmware_revision: device?.features?.revision || '',
            firmware_type: device?.firmwareType || '',
        };
        if (type === 'BUG') {
            dispatch(
                sendFeedback({
                    type: 'BUG',
                    payload: {
                        description,
                        // By the time of submission a category must be selected.
                        // Otherwise the submit button would be disabled.
                        category: category!,
                        ...userData,
                    },
                }),
            );
        } else {
            dispatch(
                sendFeedback({
                    type: 'SUGGESTION',
                    payload: {
                        description,
                        rating: rating?.id,
                        ...userData,
                    },
                }),
            );
        }
        dispatch(setView('GUIDE_DEFAULT'));
        analytics.report({
            type: EventType.GuideFeedbackSubmit,
            payload: { type: type === 'BUG' ? 'bug' : 'suggestion' },
        });
    }, [device, dispatch, type, description, category, rating?.id]);

    return (
        <GuideViewWrapper>
            <GuideHeader
                back={goBack}
                label={
                    type === 'BUG' ? (
                        <Translation id="TR_GUIDE_VIEW_HEADLINE_REPORT_BUG" />
                    ) : (
                        <Translation id="TR_GUIDE_VIEW_HEADLINE_SUGGEST" />
                    )
                }
            />
            <GuideContent>
                {type === 'BUG' && (
                    <>
                        <Headline>
                            <Translation id="TR_GUIDE_FEEDBACK_CATEGORY_HEADLINE" />
                        </Headline>
                        <SelectWrapper data-test="@guide/feedback/suggestion-dropdown">
                            <Select
                                data-test="@guide/feedback/suggestion-dropdown/select"
                                isSearchable={false}
                                defaultValue={category && categoryToOption(category)}
                                options={Object.keys(feedbackCategories).map(category =>
                                    categoryToOption(category as FeedbackCategory),
                                )}
                                onChange={(option: FeedbackCategoryOption) =>
                                    setCategory(option.value)
                                }
                                placeholder={
                                    <Translation id="TR_FEEDBACK_CATEGORY_SELECT_PLACEHOLDER" />
                                }
                            />
                        </SelectWrapper>
                    </>
                )}
                {type === 'SUGGESTION' && (
                    <>
                        <Headline>
                            <Translation id="TR_GUIDE_FEEDBACK_RATING_HEADLINE" />
                        </Headline>
                        <RatingWrapper>
                            {ratingOptions.map(item => (
                                <RatingItem
                                    key={item.id}
                                    selected={rating?.id === item.id}
                                    onClick={() => setRating(item)}
                                    data-test={`@guide/feedback/suggestion/${item.id}`}
                                >
                                    {item.value}
                                </RatingItem>
                            ))}
                        </RatingWrapper>
                    </>
                )}
                {type === 'BUG' && (
                    <Headline>
                        <Translation id="TR_GUIDE_FEEDBACK_BUG_TEXT_HEADLINE" />
                    </Headline>
                )}
                {type === 'SUGGESTION' && (
                    <Headline>
                        <Translation id="TR_GUIDE_FEEDBACK_SUGGESTION_TEXT_HEADLINE" />
                    </Headline>
                )}

                <Textarea
                    rows={8}
                    value={description}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        setDescription(e.target.value)
                    }
                    noTopLabel
                    characterCount
                    data-test="@guide/feedback/suggestion-form"
                    maxLength={MESSAGE_CHARACTER_LIMIT}
                />

                <Submit
                    onClick={onSubmit}
                    isDisabled={
                        description.length === 0 ||
                        (type === 'SUGGESTION' && rating === undefined) ||
                        (type === 'BUG' && category === undefined)
                    }
                    data-test="@guide/feedback/submit-button"
                >
                    <Translation id="TR_GUIDE_FEEDBACK_SEND_REPORT" />
                </Submit>

                <CollapsibleBox
                    subHeading={<Translation id="TR_GUIDE_FEEDBACK_SYSTEM_INFO_NOTICE" />}
                    variant="small"
                >
                    <AnonymousDataList>
                        <AnonymousDataItem>
                            <Translation id="TR_FEEDBACK_ANALYTICS_ITEM_OS" />
                        </AnonymousDataItem>
                        <AnonymousDataItem>
                            <Translation id="TR_FEEDBACK_ANALYTICS_ITEM_BROWSER" />
                        </AnonymousDataItem>
                        <AnonymousDataItem>
                            <Translation id="TR_FEEDBACK_ANALYTICS_ITEM_FW" />
                        </AnonymousDataItem>
                        <AnonymousDataItem>
                            <Translation id="TR_FEEDBACK_ANALYTICS_ITEM_APP" />
                        </AnonymousDataItem>
                    </AnonymousDataList>
                </CollapsibleBox>
            </GuideContent>
        </GuideViewWrapper>
    );
};
