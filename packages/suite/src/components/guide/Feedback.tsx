import { ChangeEvent, ReactNode, useCallback, useState } from 'react';

import styled from 'styled-components';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import {
    FeedbackCategory,
    FeedbackType,
    Rating,
    buildUserFeedbackData,
    sendFeedbackAction,
} from '@suite-common/feedback';
import { Button, CollapsibleBox, Select, Textarea } from '@trezor/components';
import { typography } from '@trezor/theme';

import { setView } from 'src/actions/suite/guideActions';
import { GuideContent, GuideHeader, GuideViewWrapper } from 'src/components/guide';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { EmojiRatingSelector } from '../suite/EmojiRatingSelector';

const Headline = styled.div`
    ${typography['body-xs']}
    text-align: left;
    color: ${({ theme }) => theme.textDefault};
    padding: 0 0 11px;
    width: 100%;
`;

const SelectWrapper = styled.div`
    padding: 0 0 20px;
`;

const AnonymousDataList = styled.ul`
    margin-left: 20px;
`;

const AnonymousDataItem = styled.li`
    margin-bottom: 4px;
    ${typography['body-sm']}
    color: ${({ theme }) => theme.textDefault};
`;

const MESSAGE_CHARACTER_LIMIT = 1000;

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
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const router = useSelector(state => state.router);
    const [description, setDescription] = useState('');
    const [rating, setRating] = useState<Rating | undefined>();

    const feedbackCategories: { [key in FeedbackCategory]: ReactNode } = {
        dashboard: <Translation id="TR_FEEDBACK_CATEGORY_DASHBOARD" />,
        account: <Translation id="TR_FEEDBACK_CATEGORY_ACCOUNT" />,
        settings: <Translation id="TR_FEEDBACK_CATEGORY_SETTINGS" />,
        send: <Translation id="TR_FEEDBACK_CATEGORY_SEND" />,
        receive: <Translation id="TR_FEEDBACK_CATEGORY_RECEIVE" />,
        trade: <Translation id="TR_FEEDBACK_CATEGORY_TRADE" />,
        experimental: <Translation id="TR_FEEDBACK_CATEGORY_EXPERIMENTAL" />,
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
        const userData = buildUserFeedbackData(device);

        if (type === 'BUG') {
            dispatch(
                sendFeedbackAction({
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
                sendFeedbackAction({
                    type: 'SUGGESTION',
                    payload: {
                        description,
                        rating,
                        ...userData,
                    },
                }),
            );
        }
        dispatch(setView('GUIDE_DEFAULT'));
        analytics.report({
            type: events.guideFeedbackSubmitEvent.name,
            payload: { type: type === 'BUG' ? 'bug' : 'suggestion' },
        });
    }, [device, type, dispatch, analytics, description, category, rating]);

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
                        <SelectWrapper data-testid="@guide/feedback/suggestion-dropdown">
                            <Select
                                data-testid="@guide/feedback/suggestion-dropdown/select"
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
                        <EmojiRatingSelector
                            value={rating}
                            onChange={setRating}
                            data-testid="@guide/feedback/suggestion"
                        />
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
                    characterCount
                    data-testid="@guide/feedback/suggestion-form"
                    maxLength={MESSAGE_CHARACTER_LIMIT}
                    margin={{ bottom: 16 }}
                />

                <Button
                    onClick={onSubmit}
                    isDisabled={
                        description.length === 0 ||
                        (type === 'SUGGESTION' && rating === undefined) ||
                        (type === 'BUG' && category === undefined)
                    }
                    data-testid="@guide/feedback/submit-button"
                    width="100%"
                    margin={{ bottom: 20 }}
                >
                    <Translation id="TR_GUIDE_FEEDBACK_SEND_REPORT" />
                </Button>

                <CollapsibleBox heading={<Translation id="TR_GUIDE_FEEDBACK_SYSTEM_INFO_NOTICE" />}>
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
