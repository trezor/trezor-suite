import React, { useCallback, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { Translation } from '@suite-components';
import { useActions, useDevice } from '@suite-hooks';
import { Textarea, Select, variables } from '@trezor/components';
import * as guideActions from '@suite-actions/guideActions';
import { ViewWrapper, Header, Content } from '@guide-components';
import { Rating, Category, FeedbackType, UserData } from '@suite-types/guide';
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

const Submit = styled.button`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-align: center;
    color: ${props => props.theme.TYPE_WHITE};
    background: ${props => props.theme.BG_GREEN};
    border-radius: 8px;
    border: none;
    padding: 10px;
    width: 100%;
    margin: 0 0 20px;
    cursor: pointer;
`;

const SelectWrapper = styled.div`
    padding: 0 0 20px 0;
`;

const TextareaWrapper = styled.div`
    position: relative;
`;

const FeedbackInfoNotice = styled.small`
    display: block;
    font-size: 10px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-align: center;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    padding: 0 0 8px;
    width: 100%;
`;

const CharacterCount = styled.div`
    position: absolute;
    bottom: 35px;
    right: 15px;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
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

    &:hover {
        background: ${props => props.theme.STROKE_GREY};
    }

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
        id: 1,
        value: <>&#128545;</>,
    },
    {
        id: 2,
        value: <>&#128533;</>,
    },
    {
        id: 3,
        value: <>&#128529;</>,
    },
    {
        id: 4,
        value: <>&#128522;</>,
    },
    {
        id: 5,
        value: <>&#128525;</>,
    },
];

const Feedback = ({ type }: Props) => {
    const { device } = useDevice();
    const { setView, sendFeedback } = useActions({
        setView: guideActions.setView,
        sendFeedback: guideActions.sendFeedback,
    });
    const [description, setDescription] = React.useState('');
    const [rating, setRating] = React.useState<RatingItem>();
    const [category, setCategory] = React.useState<Category>('dashboard');

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
                    category,
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
    }, [device, firmwareType, type, setView, sendFeedback, description, category, rating?.id]);

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
                                defaultValue={{ label: 'Dashboard', value: 'dashboard' }}
                                options={[
                                    { label: 'Dashboard', value: 'dashboard' },
                                    { label: 'Accounts', value: 'account' },
                                    { label: 'Settings', value: 'settings' },
                                    { label: 'Send', value: 'send' },
                                    { label: 'Receive', value: 'receive' },
                                    { label: 'Trade', value: 'trade' },
                                    { label: 'Other', value: 'other' },
                                ]}
                                borderWidth={1}
                                borderRadius={8}
                                onChange={(option: { value: Category; label: string }) =>
                                    setCategory(option.value)
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
                <TextareaWrapper>
                    <Textarea
                        rows={8}
                        borderWidth={1}
                        borderRadius={8}
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setDescription(e.target.value)
                        }
                        noTopLabel
                    />
                    <CharacterCount>
                        {description.length} / {MESSAGE_CHARACTER_LIMIT}
                    </CharacterCount>
                </TextareaWrapper>

                <Submit onClick={onSubmit}>
                    <Translation id="TR_GUIDE_FEEDBACK_SEND_REPORT" />
                </Submit>

                <FeedbackInfoNotice>
                    <Translation id="TR_GUIDE_FEEDBACK_BROWSER_INFO_NOTICE" />
                </FeedbackInfoNotice>
            </Content>
        </ViewWrapper>
    );
};

export default Feedback;
