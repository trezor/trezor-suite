---
name: common-issues
description: 'Use when troubleshooting Trezor Suite Playwright installation failures, network timeouts or TypeScript errors. Contains brief notes for these problems.'
---

# Common Issues

- **Playwright failures**: Use `yarn --mode=skip-build` during installation
- **Network timeouts**: Retry commands; common in restricted environments
- **Type errors**: Use the narrowest available TypeScript check; reserve broader checks for final validation
