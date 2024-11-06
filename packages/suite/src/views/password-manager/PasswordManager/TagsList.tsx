import styled from 'styled-components';

import { PasswordTag } from '@suite-common/metadata-types';
import { spacingsPx } from '@trezor/theme';

import { Tag } from './Tag';

const TagsListWrapper = styled.div`
    display: flex;
    flex-direction: row;
    margin-bottom: ${spacingsPx.xs};
    gap: ${spacingsPx.xxs};
`;

interface TagsListProps {
    tags: Record<string, PasswordTag>;
    selectedTags: Record<string, boolean>;
    setSelectedTags: (tags: Record<string, boolean>) => void;
}

export const TagsList = ({ tags, selectedTags, setSelectedTags }: TagsListProps) => {
    return (
        <TagsListWrapper>
            {Object.entries(tags)
                // filter out 'all' tag. it is in legacy data. I am hiding it from UI only for now.
                .filter(([key]) => key !== '0')
                .map(([key, value]) => (
                    <Tag
                        key={key}
                        title={value.title}
                        onClick={() => {
                            // based on discussion with comrade Komret, it is probably not a desirable feature
                            // to have multiple tags selected at the same time. But in case maybe product team
                            // decides it is, it is possible to enable it by setting allowMultiSelect to true.
                            const allowMultiSelect = false;

                            if (allowMultiSelect) {
                                setSelectedTags({
                                    ...selectedTags,
                                    [key]: !selectedTags[key],
                                });
                            } else {
                                setSelectedTags({
                                    [key]: !selectedTags[key],
                                });
                            }
                        }}
                        isSelected={selectedTags[key]}
                    />
                ))}
        </TagsListWrapper>
    );
};
