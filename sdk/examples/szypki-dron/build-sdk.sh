#!/bin/bash

cd ../.. && pnpm build && cd - && rm -rf node_modules && yarn install
