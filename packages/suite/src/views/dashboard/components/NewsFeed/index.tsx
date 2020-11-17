import React, { useState } from 'react';
import styled, { useTheme, css } from 'styled-components';
import TextTruncate from 'react-text-truncate';
import { Translation } from '@suite-components';
import { Section } from '@dashboard-components';
import { Button, variables } from '@trezor/components';
import { useFetchNews } from '@dashboard-hooks/useNews';

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

const Post = styled.div`
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

const ReadMore = styled.a`
    display: flex;
    align-self: flex-start;
    color: ${props => props.theme.TYPE_DARK_GREY};
    margin: 10px 0 0 0;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const MediumLink = styled.a``;

const NewsFeed = () => {
    const [visibleCount, incrementVisibleCount] = useState(3);
    const { posts, isError, fetchCount, incrementFetchCount } = useFetchNews();
    const theme = useTheme();

    if (isError) return null;

    return (
        <Section
            heading={<Translation id="TR_WHATS_NEW" />}
            actions={
                <MediumLink target="_blank" href="https://blog.trezor.io/">
                    <Button isWhite variant="tertiary" icon="MEDIUM">
                        <Translation id="TR_OPEN_IN_MEDIUM" />
                    </Button>
                </MediumLink>
            }
        >
            <Posts>
                {posts.slice(0, visibleCount).map(item => (
                    <Post key={item.link}>
                        <Image src={item.thumbnail} />
                        <Content>
                            <Title>
                                <TextTruncate
                                    line={2}
                                    element="div"
                                    truncateText="…"
                                    text={item.title}
                                />
                            </Title>
                            <Description>
                                <TextTruncate
                                    line={3}
                                    element="div"
                                    truncateText="…"
                                    text={item.description}
                                />
                            </Description>
                            <ReadMore target="_blank" href={item.link}>
                                <Button
                                    variant="tertiary"
                                    alignIcon="right"
                                    color={theme.TYPE_DARK_GREY}
                                    icon="EXTERNAL_LINK"
                                >
                                    <Translation id="TR_READ_MORE" />
                                </Button>
                            </ReadMore>
                        </Content>
                    </Post>
                ))}
            </Posts>
            {posts.length > visibleCount && (
                <BottomAction>
                    <Button
                        variant="tertiary"
                        onClick={() => {
                            incrementVisibleCount(visibleCount + 3);
                            incrementFetchCount(fetchCount + 3);
                        }}
                    >
                        <Translation id="TR_SHOW_OLDER_NEWS" />
                    </Button>
                </BottomAction>
            )}
        </Section>
    );
};

export default NewsFeed;
