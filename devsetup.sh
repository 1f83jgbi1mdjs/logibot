#!/bin/env bash

curl https://mise.run | sh
~/.local/bin/mise trust
~/.local/bin/mise install
cp .env.example .env
