const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, {
  polling: true
});

const SIGNALS_CHAT_ID =
  process.env.SIGNALS_CHAT_ID;

const SIGNALS_THREAD_ID =
  process.env.SIGNALS_THREAD_ID;

// الأسهم المسموحة
const symbols = [
  'TSLA',
  'NVDA',
  'AMZN',
  'SPY',
  'QQQ',
  'META'
];

// الصفقات المفتوحة
const activeSignals = new Map();

// منع التكرار
const sentSignals = new Set();

// تشغيل البوت
bot.onText(/\/start/, async (msg) => {

  await bot.sendMessage(
    msg.chat.id,
    '🚀 ST Signals Bot يعمل بنجاح'
  );

});

// استخراج معلومات الموضوع
bot.onText(/\/topicid/, async (msg) => {

  await bot.sendMessage(
    msg.chat.id,
`📌 معلومات الموضوع:

Chat ID:
${msg.chat.id}

Thread ID:
${msg.message_thread_id || 'لا يوجد'}
`
  );

});

// إنشاء صفقة تجريبية
function generateFakeSignal(symbol) {

  const types = ['CALL', 'PUT'];

  const type =
    types[Math.floor(Math.random() * types.length)];

  const entry =
    Number((Math.random() * 1 + 1.5).toFixed(2));

  const strike =
    Math.floor(Math.random() * 300 + 100);

  const confidence =
    Math.floor(Math.random() * 10 + 90);

  return {
    symbol,
    type,
    strike,
    confidence,
    entry,
    currentPrice: entry,
    stopLoss: Number((entry - 0.30).toFixed(2)),
    nextUpdate: Number((entry + 0.10).toFixed(2)),
    target: Number((entry + 0.50).toFixed(2)),
    status: 'OPEN'
  };

}

// إرسال صفقة جديدة
async function sendSignal(signal) {

  const uniqueKey =
    `${signal.symbol}-${signal.type}-${signal.strike}`;

  if (sentSignals.has(uniqueKey)) {
    return;
  }

  sentSignals.add(uniqueKey);

  activeSignals.set(uniqueKey, signal);

  const message = `
🚨 ST TRADE VIP SIGNAL

📊 ${signal.symbol}

📈 Type: ${signal.type}

🎯 Strike: ${signal.strike}

💰 Entry: $${signal.entry}

🛡 Stop Loss: $${signal.stopLoss}

🎯 Target: $${signal.target}

🔥 Confidence: ${signal.confidence}%

#STTradeVIP
`;

  await bot.sendMessage(
    SIGNALS_CHAT_ID,
    message,
    {
      message_thread_id:
        Number(SIGNALS_THREAD_ID)
    }
  );

}

// تحديثات الصفقات
async function updateSignals() {

  for (const [key, signal] of activeSignals) {

    if (signal.status !== 'OPEN') {
      continue;
    }

    // حركة سعر تجريبية
    const movement =
      (Math.random() * 0.20 - 0.05);

    signal.currentPrice =
      Number(
        (signal.currentPrice + movement)
        .toFixed(2)
      );

    // حساب النسبة
    const pnl =
      (
        (
          (signal.currentPrice - signal.entry)
          / signal.entry
        ) * 100
      ).toFixed(2);

    // قريب من الوقف
    if (
      signal.currentPrice <=
      signal.stopLoss + 0.05
      &&
      signal.currentPrice >
      signal.stopLoss
    ) {

      await bot.sendMessage(
        SIGNALS_CHAT_ID,
`
⚠️ تنبيه مهم

${signal.symbol} ${signal.type}

💰 Entry: $${signal.entry}

📉 Current: $${signal.currentPrice}

❌ PNL: ${pnl}%

🛡 قريب من وقف الخسارة
`,
        {
          message_thread_id:
            Number(SIGNALS_THREAD_ID)
        }
      );

    }

    // ضرب الوقف
    if (
      signal.currentPrice <=
      signal.stopLoss
    ) {

      signal.status = 'STOPPED';

      await bot.sendMessage(
        SIGNALS_CHAT_ID,
`
🛑 تم ضرب وقف الخسارة

${signal.symbol} ${signal.type}

💰 Entry: $${signal.entry}

📉 Exit: $${signal.currentPrice}

❌ Final PNL: ${pnl}%
`,
        {
          message_thread_id:
            Number(SIGNALS_THREAD_ID)
        }
      );

      continue;
    }

    // تحقيق الهدف
    if (
      signal.currentPrice >=
      signal.target
    ) {

      signal.status = 'TARGET';

      await bot.sendMessage(
        SIGNALS_CHAT_ID,
`
🎯 تم تحقيق الهدف

${signal.symbol} ${signal.type}

💰 Entry: $${signal.entry}

📈 Exit: $${signal.currentPrice}

✅ Final Profit: +${pnl}%
`,
        {
          message_thread_id:
            Number(SIGNALS_THREAD_ID)
        }
      );

      continue;
    }

    // تحديث كل +0.10
    if (
      signal.currentPrice >=
      signal.nextUpdate
    ) {

      await bot.sendMessage(
        SIGNALS_CHAT_ID,
`
🚀 تحديث الصفقة

${signal.symbol} ${signal.type}

💰 Entry: $${signal.entry}

📈 Current: $${signal.currentPrice}

✅ Profit: +${pnl}%

🎯 Next Target:
$${Number(
  (signal.currentPrice + 0.10)
  .toFixed(2)
)}
`,
        {
          message_thread_id:
            Number(SIGNALS_THREAD_ID)
        }
      );

      signal.nextUpdate =
        Number(
          (
            signal.currentPrice + 0.10
          ).toFixed(2)
        );

    }

  }

}

// فحص السوق
async function scanMarket() {

  console.log('📡 Scanning market...');

  for (const symbol of symbols) {

    const signal =
      generateFakeSignal(symbol);

    if (signal.confidence >= 90) {

      await sendSignal(signal);

      console.log(
        `✅ Signal Sent: ${symbol}`
      );

    }

  }

}

// تشغيل أول مرة
scanMarket();

// فحص السوق كل 5 دقائق
setInterval(
  scanMarket,
  5 * 60 * 1000
);

// تحديث الصفقات كل دقيقة
setInterval(
  updateSignals,
  60 * 1000
);

console.log('🚀 ST Signals Bot Started');
