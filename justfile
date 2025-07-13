set dotenv-load

update:
    (git pull)

debug:
    (deno task dev $TELEGRAM_BOT_TOKEN $AUTHORIZED_CHAT_ID $BRANCH_DESIGNATIONS)

test:
    (deno test)

build:
    (deno build)

start:
    (cd .target/ && logibot $TELEGRAM_BOT_TOKEN $AUTHORIZED_CHAT_ID $BRANCH_DESIGNATIONS)
