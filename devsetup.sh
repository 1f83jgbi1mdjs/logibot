#!/bin/env bash

# Install mise only if it's not already available
if [ ! -f ~/.local/bin/mise ]; then
    curl https://mise.run | sh
fi

~/.local/bin/mise trust
~/.local/bin/mise install

# Copy .env.example to .env only if .env doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo ".env file created from .env.example"
else
    echo ".env file already exists, skipping copy"
fi
