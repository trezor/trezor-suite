import { Page } from '@playwright/test';
import { cloneDeep } from 'lodash';

import { invityEndpoint, invityGeneralResponses } from '../../fixtures/invity';
import { SellTradeResponse, TradeResponse } from '../../fixtures/invity/types';
import {
    getSignatureStatusesResponse,
    sendTransactionResponse,
} from '../../fixtures/solana-responses';
import { step } from '../common';

export class TradingMock {
    constructor(private page: Page) {
        this.validatePassphraseEnv();
    }

    // Common responses for all trading tests.
    @step()
    async routeInvityGeneralEndpoints() {
        for (const [url, response] of Object.entries(invityGeneralResponses)) {
            await this.page.route(url, async route => {
                await route.fulfill({ json: response });
            });
        }
    }

    // We bypass the provider part of the flow by having a modified redirect in trade response.
    // This redirect is provided by Invity and normaly leads to provider's page.
    // But our mocked response redirects us to back to Suite where our flow continues.
    @step()
    async routeTrade(endpointUrl: string, tradeResponse: TradeResponse | SellTradeResponse) {
        await this.routeInvityGeneralEndpoints();
        await this.page.route(endpointUrl, async (route, request) => {
            const redirectedTradeResponse = this.createRedirectedTradeResponse(
                tradeResponse,
                request.postDataJSON(),
            );
            await route.fulfill({ json: redirectedTradeResponse });
        });
    }

    // Solana sell flow uses Solana provider to send transactions.
    // We mock these requests to prevent sending real transactions.
    // Thanks to that we are able to test the whole sell flow without sending real crypto.
    @step()
    async routeSolanaSendRequests() {
        const solUrlPattern = /^https:\/\/sol\d+\.trezor\.io\//;
        await this.page.route(solUrlPattern, (route, request) => {
            const method = request.method();
            const postData = request.postData();

            if (method === 'POST' && postData) {
                const postDataJson = JSON.parse(postData);

                //IMPORTANT: Mocking this request prevents from actually sending crypto
                if (postDataJson.method === 'sendTransaction') {
                    route.fulfill({ json: sendTransactionResponse(postDataJson.id) });

                    return;
                }

                if (postDataJson.method === 'getSignatureStatuses') {
                    route.fulfill({ json: getSignatureStatusesResponse(postDataJson.id) });

                    return;
                }
            }
            route.continue();
        });
    }

    @step()
    async changeBuyWatchResponseTo(status: 'SUBMITTED' | 'SUCCESS') {
        await this.page.route(invityEndpoint.buyWatch, async route => {
            await route.fulfill({ json: { status } });
        });
    }

    // This modification allows us to skip the provider's part of the flow and continue further.
    // Partner's URL is replaced with Suite's URL redirect. And we also set correct Ids
    createRedirectedTradeResponse = (
        tradeResponse: TradeResponse | SellTradeResponse,
        tradeRequest: any,
    ) => {
        const modifiedResponse = cloneDeep(tradeResponse);
        modifiedResponse.trade.partnerData = tradeRequest.returnUrl;
        modifiedResponse.tradeForm.form.formAction = tradeRequest.returnUrl;
        modifiedResponse.trade.paymentId = tradeRequest.trade.paymentId;
        modifiedResponse.trade.orderId = tradeRequest.trade.orderId;
        if ('refundAddress' in modifiedResponse.trade && tradeRequest.refundAddress) {
            modifiedResponse.trade.refundAddress = tradeRequest.refundAddress;
        }

        return modifiedResponse;
    };

    validatePassphraseEnv = () => {
        if (!process.env.PASSPHRASE) {
            throw new Error(
                'PASSPHRASE not provided in env variables. Check docs/tests/e2e-playwright-suite.md.',
            );
        }
    };
}
