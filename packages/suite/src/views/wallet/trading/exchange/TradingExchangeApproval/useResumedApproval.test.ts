import { act, renderHook } from '@testing-library/react';
import type { CryptoId, ExchangeTrade } from 'invity-api';

import { useResumedApproval } from './useResumedApproval';

const APPROVAL_QUOTE: ExchangeTrade = {
    quoteId: 'e6f30f83-8c0f-4a5c-9fa0-2f8a5d0f5b53',
    exchange: 'lifi',
    status: 'APPROVAL_REQ',
    isDex: true,
    send: 'ethereum--0xdac17f958d2ee523a2206206994597c13d831ec7' as CryptoId,
    receive: 'ethereum' as CryptoId,
    sendStringAmount: '1100',
    receiveStringAmount: '0.463',
    receiveAddress: '0x0000000000000000000000000000000000000001',
};

type ResumedApprovalProps = {
    quote: ExchangeTrade;
    pendingApprovalTxid: string | undefined;
};

const renderResumedApproval = (initialProps: ResumedApprovalProps) => {
    let resolveConfirm: (trade: ExchangeTrade | undefined) => void = () => {};
    const confirmApproval = jest.fn(
        () =>
            new Promise<ExchangeTrade | undefined>(resolve => {
                resolveConfirm = resolve;
            }),
    );

    const { result, rerender } = renderHook(
        (props: ResumedApprovalProps) => useResumedApproval({ ...props, confirmApproval }),
        { initialProps },
    );

    return { result, rerender, confirmApproval, resolveConfirm: () => resolveConfirm(undefined) };
};

describe('useResumedApproval', () => {
    it('shows the pending approval tx without confirming', () => {
        const { result, confirmApproval } = renderResumedApproval({
            quote: APPROVAL_QUOTE,
            pendingApprovalTxid: '0xaaa',
        });

        expect(result.current).toEqual({ isConfirming: false, txid: '0xaaa' });
        expect(confirmApproval).not.toHaveBeenCalled();
    });

    it('confirms exactly once after the pending tx disappears', async () => {
        const { result, rerender, confirmApproval, resolveConfirm } = renderResumedApproval({
            quote: APPROVAL_QUOTE,
            pendingApprovalTxid: '0xaaa',
        });

        rerender({ quote: APPROVAL_QUOTE, pendingApprovalTxid: undefined });
        rerender({ quote: { ...APPROVAL_QUOTE }, pendingApprovalTxid: undefined });

        expect(confirmApproval).toHaveBeenCalledTimes(1);
        expect(confirmApproval).toHaveBeenCalledWith({
            trade: APPROVAL_QUOTE,
            receiveAddress: APPROVAL_QUOTE.receiveAddress,
        });
        expect(result.current).toEqual({ isConfirming: true, txid: '0xaaa' });

        await act(() => {
            resolveConfirm();

            return Promise.resolve();
        });

        expect(result.current).toEqual({ isConfirming: false, txid: undefined });
    });

    it('does not confirm when the pending tx is replaced by a speed-up', () => {
        const { result, rerender, confirmApproval } = renderResumedApproval({
            quote: APPROVAL_QUOTE,
            pendingApprovalTxid: '0xaaa',
        });

        rerender({ quote: APPROVAL_QUOTE, pendingApprovalTxid: '0xbbb' });

        expect(confirmApproval).not.toHaveBeenCalled();
        expect(result.current).toEqual({ isConfirming: false, txid: '0xbbb' });
    });

    it('does not confirm while the quote is APPROVAL_PENDING', () => {
        const pendingQuote: ExchangeTrade = { ...APPROVAL_QUOTE, status: 'APPROVAL_PENDING' };
        const { result, rerender, confirmApproval } = renderResumedApproval({
            quote: pendingQuote,
            pendingApprovalTxid: '0xaaa',
        });

        rerender({ quote: pendingQuote, pendingApprovalTxid: undefined });

        expect(confirmApproval).not.toHaveBeenCalled();
        expect(result.current).toEqual({ isConfirming: false, txid: undefined });
    });
});
