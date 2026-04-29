import { StyleSheet } from 'react-native';

import { renderWithBasicProvider } from '@suite-native/test-utils';

import { NfcTagsVisual } from '../NfcTagsVisual';

const getOpacity = (tag: { props: { style: unknown } }) =>
    StyleSheet.flatten(tag.props.style).opacity;

describe('NfcTagsVisual', () => {
    it('renders 3 tags by default', () => {
        const { getAllByTestId } = renderWithBasicProvider(<NfcTagsVisual />);

        expect(getAllByTestId(/^@nfc-tag\//)).toHaveLength(3);
    });

    it('renders all tags as active by default', () => {
        const { getAllByTestId } = renderWithBasicProvider(<NfcTagsVisual />);

        const tags = getAllByTestId(/^@nfc-tag\//);
        tags.forEach(tag => {
            expect(getOpacity(tag)).toBe(1);
        });
    });

    it('renders correct number of active and inactive tags', () => {
        const { getAllByTestId } = renderWithBasicProvider(<NfcTagsVisual activeCount={2} />);

        const tags = getAllByTestId(/^@nfc-tag\//);
        expect(tags).toHaveLength(3);
        expect(getOpacity(tags[0])).toBe(1);
        expect(getOpacity(tags[1])).toBe(1);
        expect(getOpacity(tags[2])).toBe(0.4);
    });
});
