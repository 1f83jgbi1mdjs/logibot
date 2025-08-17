set dotenv-load

update:
    (git pull)

debug:
    (rm services/logibot.log)
    (./deno task dev)

test:
    (./deno test)

build:
    (./deno build)

start:
    (cd .target/ && logibot)

install_service:
    (sudo loginctl enable-linger $USER)
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
