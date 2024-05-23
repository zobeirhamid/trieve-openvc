FROM oven/bun:1.1-alpine as base
WORKDIR /usr/src/app

# install with --production (exclude devDependencies)
FROM base AS install
RUN mkdir -p /temp/prod/apps
RUN mkdir -p /temp/prod/packages/schemas
COPY package.json bun.lockb /temp/prod/
COPY packages/schemas/package.json /temp/prod/packages/schemas/package.json
COPY apps/web/package.json /temp/prod/apps/web/package.json
RUN cd /temp/prod && bun install --no-save

FROM base AS prerelease
COPY --from=install /temp/prod/node_modules node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run web:build

# copy production dependencies and source code into final image
FROM base AS release
USER bun
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/packages ./packages
COPY --from=prerelease /usr/src/app/apps ./apps
COPY --from=prerelease /usr/src/app/package.json .

# run the app
EXPOSE 3000
ENTRYPOINT bun run web:start