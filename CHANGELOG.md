# Changelog

All notable changes to `@pinarkive/pinarkive-sdk-js` are documented here.

## [3.1.2] - 2026-04-14

### Fixed

- **`uploadDirectoryDAG` multipart format:** The API expects multer field **`files`** (repeated), with each part’s **filename** set to the relative path inside the DAG. The SDK previously sent `files[i][path]` / `files[i][content]`, which the backend does not parse into `req.files`.

### Publishing this package

Follow `RELEASE-STEPS.md` in this folder (release is done via `npm version …` + pushing tag `v*` to trigger GitHub Actions publish).

