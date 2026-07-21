# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim

ARG SUPABASE_CLI_VERSION

WORKDIR /opt/supabase-cli
RUN npm install --no-save --no-package-lock "supabase@${SUPABASE_CLI_VERSION}" \
    && ln -s /opt/supabase-cli/node_modules/.bin/supabase /usr/local/bin/supabase

CMD ["supabase", "--help"]
