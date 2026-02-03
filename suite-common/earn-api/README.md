# Earn API

## Yield XYZ API

1. OpenAPI spec is fetched by `scripts/fetchSpec.mjs`
2. Orval generates types and methods to `src/api`
3. A Trezor proxy service is deployed at `YIELD_XYZ_BASE_URL` (`config/index.ts`). So no need to manually provide API key.

## Yield opportunities

`useGetYieldOpportunities`: Fetch all enabled Yield XYZ opportunities.

## Enter a yield opportunity

1. Let Yield XYZ to generate transaction payloads: `useEnterYieldOpportunity`
2. Sign TX: handled without Yield XYZ
3. Broadcast TX: handle without Yield XYZ
4. Submit TX hash: `useSubmitTxHash`
