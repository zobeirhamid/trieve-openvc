# Trieve - OpenVC

## Prerequisites

- [bun](https://bun.sh/docs/installation)

## Installation

1. [Create a Trieve account and a dataset](https://trieve.ai/)
2. There are two `.env-example` files, one is located at the `/` and the other at `apps/web`. Rename them to `.env` and populate them with your Trieve data.
3. Install dependencies via `bun install`.
4. Populate your Trieve dataset via `bun run populate`.
5. Run `bun run web:dev`.

## Deployment

I provided a Dockerfile for easy deployment. Push them to your registry of choice, otherwise you can use my [Docker image](https://hub.docker.com/r/zobeirhamid0708/trieve-openvc/tags).
