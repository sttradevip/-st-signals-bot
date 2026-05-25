const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    '🚀 ST Signals Bot يعمل بنجاح'
  );
});

bot.on('message', async (msg) => {
  const text = msg.text;

  if (!text) return;
  if (text.startsWith('/')) return;

  await bot.sendMessage(
    msg.chat.id,
    `📊 تم استلام الرمز: ${text.toUpperCase()}`
  );
});

console.log('ST Signals Bot Running...');
