import { Bot, type BotError } from "grammy";
import { autoQuote } from "@roz/grammy-autoquote";
import { parseTransfers } from "./common/generated/parsers.ts";
import { HELP_TEXT_MARKDOWN, MESSAGE_MAX_LENGTH } from "./common/constants.ts";
import { formatTransfers } from "./features/transfer/index.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const AUTHORIZED_CHAT_ID = Deno.env.get("AUTHORIZED_CHAT_ID");
const BRANCH_DESIGNATIONS = Deno.env.get("BRANCH_DESIGNATIONS");

if (
  TELEGRAM_BOT_TOKEN === undefined || AUTHORIZED_CHAT_ID === undefined ||
  BRANCH_DESIGNATIONS === undefined
) {
  console.error("One or more required environment variables are missing. Check .env file.");
  Deno.exit(1);
}

const authorizedChatId = parseInt(AUTHORIZED_CHAT_ID, 10);

const bot = new Bot(TELEGRAM_BOT_TOKEN);

// @ts-ignore Fantom compile time error
bot.use(autoQuote({ allowSendingWithoutReply: true }));

bot.catch(({ error, ctx }) => {
  console.log(error);
  ctx.reply((error as BotError).message, { parse_mode: "Markdown" });
});

await bot.api.setMyCommands([
  { command: "help", description: "Показать справочную информацию" },
  { command: "chatid", description: "Получить ID данного чата" },
  { command: "sort", description: "Сортировать перемещения" },
]).then((isSuccess) =>
  console.log(isSuccess ? "Bot commands set." : "Unknown error while setting bot commands!")
).catch(console.error);

bot.command("help", (ctx) => {
  const { message } = ctx;

  if (message !== undefined) {
    ctx.reply(HELP_TEXT_MARKDOWN, { parse_mode: "MarkdownV2" }).catch(console.error);
  }
});

bot.command("chatid", async (ctx) => {
  const { message } = ctx;

  if (message !== undefined) {
    await bot.api.sendMessage(
      message.chat.id,
      `ID этого чата \\(нажмите, чтобы скопировать\\): \`${message.chat.id}\``,
      { parse_mode: "MarkdownV2" },
    ).catch(console.error);
  }
});

bot.command("sort", (ctx) => {
  const { message } = ctx;

  if (message !== undefined) {
    if (message.chat.id === authorizedChatId) {
      if (message.reply_to_message?.text === undefined) {
        ctx.reply(
          "Данная команда работает только в ответ на сообщение с перемещениями.",
        ).catch(console.error);
      } else {
        const parsedResult = parseTransfers(message.reply_to_message.text, BRANCH_DESIGNATIONS);
        const { data: transfers, error } = formatTransfers(parsedResult);

        if (transfers !== null && transfers.length > 0) {
          const fullResult = transfers.join("\n\n");

          // TODO: Consider optimizations, this whole branch is AI-generated
          // If the full result exceeds the maximum message length,
          // split it into chunks without breaking lines
          if (fullResult.length > MESSAGE_MAX_LENGTH) {
            const chunks: string[] = [];
            let currentChunk = "";

            // Split the transfers into chunks
            for (const transfer of transfers) {
              // Check if adding this transfer would exceed the limit
              if (currentChunk.length + transfer.length + 2 > MESSAGE_MAX_LENGTH) {
                // Current chunk is full, push it and start a new one
                chunks.push(currentChunk);
                currentChunk = transfer;
              } else {
                // Add to current chunk with separator if not the first item
                if (currentChunk.length > 0) {
                  currentChunk += "\n\n" + transfer;
                } else {
                  currentChunk = transfer;
                }
              }
            }

            // Add the last chunk if it has content
            if (currentChunk.length > 0) {
              chunks.push(currentChunk);
            }

            // Send each chunk as a separate message
            for (const chunk of chunks) {
              ctx.reply(chunk, { parse_mode: "MarkdownV2" }).catch(console.error);
            }
          } else ctx.reply(fullResult, { parse_mode: "MarkdownV2" }).catch(console.error);
        } else ctx.reply("Перемещений не обнаружено.").catch(console.error);

        if (error !== null) ctx.reply(error, { parse_mode: "Markdown" }).catch(console.error);
      }
    } else {ctx.reply("Этот чат не авторизован для использования данной команды.").catch(
        console.error,
      );}
  }
});

bot.start();
