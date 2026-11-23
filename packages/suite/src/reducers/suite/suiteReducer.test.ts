import { clearSendFormPrefill, setSendFormPrefill } from '#src/actions/suite/suiteActions';
import { selectSendFormPrefill } from '#src/selectors/suite/suiteSelectors';

import suiteReducer, { suiteInitialState } from './suiteReducer';

const getSendFormPrefill = (suite: typeof suiteInitialState) => selectSendFormPrefill({ suite });

describe('suiteReducer send form prefill', () => {
    it('starts without a prefill', () => {
        expect(getSendFormPrefill(suiteInitialState)).toBeUndefined();
    });

    it('replaces an NFT prefill with a token prefill, dropping the token id', () => {
        const withNFT = suiteReducer(
            suiteInitialState,
            setSendFormPrefill({ type: 'nft', contractAddress: '0xnft', tokenId: '7' }),
        );
        expect(getSendFormPrefill(withNFT)).toEqual({
            type: 'nft',
            contractAddress: '0xnft',
            tokenId: '7',
        });

        const withToken = suiteReducer(
            withNFT,
            setSendFormPrefill({ type: 'token', contractAddress: '0xtoken' }),
        );
        expect(getSendFormPrefill(withToken)).toEqual({
            type: 'token',
            contractAddress: '0xtoken',
        });
    });

    it('clears the prefill', () => {
        const withToken = suiteReducer(
            suiteInitialState,
            setSendFormPrefill({ type: 'token', contractAddress: '0xtoken' }),
        );

        expect(getSendFormPrefill(suiteReducer(withToken, clearSendFormPrefill()))).toBeUndefined();
    });
});
