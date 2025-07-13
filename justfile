set dotenv-load

update:
    (git pull)

debug:
    (./deno.sh task dev $TELEGRAM_BOT_TOKEN $AUTHORIZED_CHAT_ID $BRANCH_DESIGNATIONS)

test:
    (./deno.sh test)

build:
    (./deno.sh build)

start:
    (cd .target/ && logibot $TELEGRAM_BOT_TOKEN $AUTHORIZED_CHAT_ID $BRANCH_DESIGNATIONS)
