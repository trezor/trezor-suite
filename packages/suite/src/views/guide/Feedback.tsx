import React, { useCallback, useEffect } from 'react';
import styled, { css } from 'styled-components';

import { CharacterCount, CollapsibleBox, Translation } from '@suite-components';
import { Textarea, Select, variables, Button } from '@trezor/components';
import { useActions, useAnalytics, useDevice, useSelector } from '@suite-hooks';
import * as guideActions from '@suite-actions/guideActions';
import { ViewWrapper, Header, Content } from '@guide-components';
import { Rating, FeedbackCategory, FeedbackType, UserData } from '@suite-types/guide';
import {
    getUserAgent,
    getEnvironment,
    getOsName,
    getWindowHeight,
    getWindowWidth,
} from '@suite-utils/env';
import { getFwVersion, isBitcoinOnly } from '@suite-utils/device';

const Headline = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-align: left;
    color: ${props => props.theme.TYPE_DARK_GREY};
    padding: 0 0 11px;
    width: 100%;
`;

const Submit = styled(Button)`
    width: 100%;
    margin: 0 0 20px;
`;

const SelectWrapper = styled.div`
    padding: 0 0 20px 0;
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
    border: 1px solid ${props => props.theme.STROKE_GREY};
    cursor: pointer;
    font-size: 30px;
    background-color: inherit;

    ${props =>
        props.selected &&
        css`
            background: ${props.theme.BG_GREEN};
            border: 1px solid ${props.theme.BG_GREEN};

            &:hover {
                background: ${props.theme.BG_GREEN};
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
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

type RatingItem = {
    id: Rating;
    value: React.ReactNode;
};

interface Props {
    type: FeedbackType;
}

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
    label: React.ReactNode;
    value: FeedbackCategory;
};

const Feedback = ({ type }: Props) => {
    const analytics = useAnalytics();

    const { device } = useDevice();
    const { setView, sendFeedback } = useActions({
        setView: guideActions.setView,
        sendFeedback: guideActions.sendFeedback,
    });

    const router = useSelector(state => state.router);
    const [description, setDescription] = React.useState('');
    const [rating, setRating] = React.useState<RatingItem>();

    const feedbackCategories: { [key in FeedbackCategory]: React.ReactNode } = {
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
    const [category, setCategory] = React.useState(getDefaultCategory());

    const categoryToOption = (category: FeedbackCategory): FeedbackCategoryOption => ({
        value: category,
        label: feedbackCategories[category],
    });

    useEffect(() => {
        if (description.length >= MESSAGE_CHARACTER_LIMIT) {
            setDescription(description.slice(0, MESSAGE_CHARACTER_LIMIT));
        }
    }, [description]);

    let firmwareType = '';
    if (device) {
        firmwareType = isBitcoinOnly(device) ? 'bitcoin-only' : 'regular';
    }

    const onSubmit = useCallback(() => {
        const userData: UserData = {
            platform: getEnvironment(),
            os: getOsName(),
            user_agent: getUserAgent(),
            suite_version: process.env.VERSION || '',
            suite_revision: process.env.COMMITHASH || '',
            window_dimensions: `${getWindowWidth()}x${getWindowHeight()}`,
            device_type: device?.features?.model || '',
            firmware_version: device?.features ? getFwVersion(device) : '',
            firmware_revision: device?.features?.revision || '',
            firmware_type: firmwareType,
        };
        if (type === 'BUG') {
            sendFeedback({
                type: 'BUG',
                payload: {
                    description,
                    // By the time of submission a category must be selected.
                    // Otherwise the submit button would be disabled.
                    category: category!,
                    ...userData,
                },
            });
        } else {
            sendFeedback({
                type: 'SUGGESTION',
                payload: {
                    description,
                    rating: rating?.id,
                    ...userData,
                },
            });
        }
        setView('GUIDE_DEFAULT');
        analytics.report({
            type: 'guide/feedback/submit',
            payload: { type: type === 'BUG' ? 'bug' : 'suggestion' },
        });
    }, [
        analytics,
        device,
        firmwareType,
        type,
        setView,
        sendFeedback,
        description,
        category,
        rating?.id,
    ]);

    return (
        <ViewWrapper>
            <Header
                back={() => setView('FEEDBACK_TYPE_SELECTION')}
                label={
                    type === 'BUG' ? (
                        <Translation id="TR_GUIDE_VIEW_HEADLINE_REPORT_BUG" />
                    ) : (
                        <Translation id="TR_GUIDE_VIEW_HEADLINE_SUGGEST" />
                    )
                }
            />
            <Content>
                {type === 'BUG' && (
                    <>
                        <Headline>
                            <Translation id="TR_GUIDE_FEEDBACK_CATEGORY_HEADLINE" />
                        </Headline>
                        <SelectWrapper>
                            <Select
                                isSearchable={false}
                                defaultValue={category && categoryToOption(category)}
                                options={Object.keys(feedbackCategories).map(category =>
                                    categoryToOption(category as FeedbackCategory),
                                )}
                                borderWidth={1}
                                borderRadius={8}
                                onChange={(option: FeedbackCategoryOption) =>
                                    setCategory(option.value)
                                }
                                placeholder={
                                    <Translation id="TR_FEEDBACK_CATEGORY_SELECT_PLACEHOLDER" />
                                }
                                noTopLabel
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
                    <>
                        <Headline>
                            <Translation id="TR_GUIDE_FEEDBACK_BUG_TEXT_HEADLINE" />
                        </Headline>
                    </>
                )}
                {type === 'SUGGESTION' && (
                    <>
                        <Headline>
                            <Translation id="TR_GUIDE_FEEDBACK_SUGGESTION_TEXT_HEADLINE" />
                        </Headline>
                    </>
                )}

                <Textarea
                    rows={8}
                    borderWidth={1}
                    borderRadius={8}
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setDescription(e.target.value)
                    }
                    noTopLabel
                    data-test="@guide/feedback/suggestion-form"
                >
                    <CharacterCount current={description.length} max={MESSAGE_CHARACTER_LIMIT} />
                </Textarea>

                <Submit
                    onClick={onSubmit}
                    isDisabled={
                        description.length === 0 ||
                        (type === 'SUGGESTION' && rating === undefined) ||
                        (type === 'BUG' && category === undefined)
                    }
                >
                    <Translation id="TR_GUIDE_FEEDBACK_SEND_REPORT" />
                </Submit>

                <CollapsibleBox
                    heading={<Translation id="TR_GUIDE_FEEDBACK_SYSTEM_INFO_NOTICE" />}
                    headerJustifyContent="center"
                    variant="tiny"
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
            </Content>
        </ViewWrapper>
    );
};

export default Feedback;
