import React, { useState } from 'react';
import styled, { useTheme, css } from 'styled-components';
import Truncate from 'react-truncate';
import { Translation } from '@suite-components';
import { Section } from '@dashboard-components';
import { Button, variables } from '@trezor/components';
import { useExternalLink } from '@suite-hooks';
import { useFetchNews } from '@dashboard-hooks/useNews';
import { BLOG_URL } from '@suite-constants/urls';
import { ArrayElement } from '@suite/types/utils';

const Posts = styled.div`
    display: grid;
    grid-gap: 30px;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    width: 100%;
    flex-direction: column;
`;

const BottomAction = styled.div`
    display: flex;
    margin-top: 28px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    justify-content: center;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const Content = styled.div`
    padding: 4px;
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Post = styled.a`
    display: flex;
    padding: 6px;
    flex-direction: column;
    background: ${props => props.theme.BG_WHITE};
    border-radius: 3px;
`;

const Image = styled.img`
    width: 100%;
    height: 195px;
    border-radius: 3px;
    object-fit: cover;

    ${props =>
        props.theme.IMAGE_FILTER &&
        css`
            filter: ${props.theme.IMAGE_FILTER};
        `}
`;

const Title = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    padding: 14px 0 8px 0;
    min-height: 62px;
`;

const Description = styled.div`
    display: flex;
    flex: 1;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const ReadMore = styled.div`
    display: flex;
    align-self: flex-start;
    color: ${props => props.theme.TYPE_DARK_GREY};
    margin: 10px 0 0 0;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const MediumLink = styled.a``;

type PostComponentProps = ArrayElement<ReturnType<typeof useFetchNews>['posts']> & {
    theme: ReturnType<typeof useTheme>;
    'data-test': string;
};

const PostComponent = (props: PostComponentProps) => {
    const url = useExternalLink(props.link);
    const thumbnail = useExternalLink(props.thumbnail);

    return (
        <Post target="_blank" rel="noopener noreferrer" href={url} data-test={props['data-test']}>
            <Image src={thumbnail} />
            <Content>
                <Title>
                    <Truncate lines={2}>{props.title}</Truncate>
                </Title>
                <Description>
                    <Truncate lines={3}>{props.description}</Truncate>
                </Description>
                <ReadMore>
                    <Button
                        variant="tertiary"
                        alignIcon="right"
                        color={props.theme.TYPE_DARK_GREY}
                        icon="EXTERNAL_LINK"
                    >
                        <Translation id="TR_READ_MORE" />
                    </Button>
                </ReadMore>
            </Content>
        </Post>
    );
};

interface Props {
    maxVisibleCount?: number;
}

// Medium API allows you to fetch maximum of 10 latest articles. In dashboard we show 3 posts in a row.
// It means that the last (10th) posts will be alone in a row. We don't want that.
// For that reason, limit maximum posts shown to 9.
const NewsFeed = ({ maxVisibleCount = 9 }: Props) => {
    const [visibleCount, incrementVisibleCount] = useState(3);

    const { posts, isError, fetchCount, incrementFetchCount } = useFetchNews();
    const theme = useTheme();
    const mediumUrl = useExternalLink(BLOG_URL);
    if (isError) return null;

    return (
        <Section
            heading={<Translation id="TR_WHATS_NEW" />}
            actions={
                <MediumLink target="_blank" rel="noopener noreferrer" href={mediumUrl}>
                    <Button isWhite variant="tertiary" icon="MEDIUM">
                        <Translation id="TR_OPEN_IN_MEDIUM" />
                    </Button>
                </MediumLink>
            }
        >
            <Posts>
                {posts.slice(0, visibleCount).map((item, index) => (
                    <PostComponent
                        data-test={`@dashboard/news/post/${index}`}
                        key={item.link}
                        theme={theme}
                        {...item}
                    />
                ))}
            </Posts>
            {/* display "Show older news" button only if there are more posts to load and I won't exceed maxVisibleCount by fetching another articles */}
            {posts.length > visibleCount && visibleCount + 3 <= maxVisibleCount && (
                <BottomAction>
                    <Button
                        variant="tertiary"
                        onClick={() => {
                            incrementVisibleCount(visibleCount + 3);
                            incrementFetchCount(fetchCount + 3);
                        }}
                        data-test="@dashboard/news/show-older-news-button"
                    >
                        <Translation id="TR_SHOW_OLDER_NEWS" />
                    </Button>
                </BottomAction>
            )}
        </Section>
    );
};

export default NewsFeed;
