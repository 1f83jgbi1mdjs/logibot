set dotenv-load

update:
    (git pull)

debug:
    (./scripts/deno.sh task dev $TELEGRAM_BOT_TOKEN $AUTHORIZED_CHAT_ID $BRANCH_DESIGNATIONS)

test:
    (./scripts/deno.sh test)

build:
    (./scripts/deno.sh build)

start:
    (cd .target/ && logibot $TELEGRAM_BOT_TOKEN $AUTHORIZED_CHAT_ID $BRANCH_DESIGNATIONS)
