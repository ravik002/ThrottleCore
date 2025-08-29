# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).


## [1.0.1] - 2025-08-29
### Changed
- Updated type declarations in `index.d.ts` with improved documentation.
- Improved wording and formatting in `README.md`.


## [1.0.0] - 2025-08-28
### Added
- Initial release of **ThrottleCore**.
- Token Bucket algorithm for rate limiting.
- Redis backend support.
- Configurable IP-based limiting and custom keys.
- Optional deduplication feature using request headers/body.
- Support for adding rate limit headers in responses.