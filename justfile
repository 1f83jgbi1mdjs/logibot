set dotenv-load

update:
    (git pull)

debug:
    (./deno task dev $TELEGRAM_BOT_TOKEN $AUTHORIZED_CHAT_ID $BRANCH_DESIGNATIONS)

test:
    (./deno test)

build:
    (./deno build)

start:
    (cd .target/ && logibot $TELEGRAM_BOT_TOKEN $AUTHORIZED_CHAT_ID $BRANCH_DESIGNATIONS)

install_service:
    (mkdir -p ~/.config/systemd/user)
    (cp --update=all ./services/logibot.service ~/.config/systemd/user/)
    (systemctl --user enable logibot.service)

start_service:
    (systemctl --user start logibot.service)

stop_service:
    (systemctl --user stop logibot.service)

restart_service:
    (systemctl --user start logibot.service)

read_service_log:
    (tail -f ./services/logibot.log)
