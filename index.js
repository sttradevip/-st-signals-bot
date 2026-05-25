const TelegramBot = require('node-telegram-bot-api');
const sharp = require('sharp');

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, {
  polling: true
});

// معلومات التلقرام
const CHAT_ID = '-1002840761137';
const THREAD_ID = 12385;

// الأسهم
const symbols = [
  'TSLA',
  'NVDA',
  'AMZN',
  'SPY',
  'QQQ',
  'META'
];

// حفظ الصفقات
const activeTrades = {};

// إنشاء صورة احترافية
async function createTradeImage(symbol, type, price) {

  const color =
    type === 'CALL'
      ? '#00ff99'
      : '#ff2d55';

  const svg = `
  <svg width="800" height="450">
    <style>
      .title {
        fill: white;
        font-size: 42px;
        font-family: "DejaVu Sans";
        font-weight: bold;
      }

      .symbol {
        fill: white;
        font-size: 95px;
        font-family: "DejaVu Sans";
        font-weight: bold;
      }

      .type {
        fill: ${color};
        font-size: 60px;
        font-family: "DejaVu Sans";
        font-weight: bold;
      }

      .price {
        fill: #ffd166;
        font-size: 55px;
        font-family: "DejaVu Sans";
        font-weight: bold;
      }
    </style>

    <rect
      width="800"
      height="450"
      fill="#050816"
    />

    <rect
      x="20"
      y="20"
      width="760"
      height="410"
      rx="25"
      ry="25"
      fill="none"
      stroke="${color}"
      stroke-width="8"
    />

    <text
      x="400"
      y="90"
      text-anchor="middle"
      class="title"
    >
      ST TRADE VIP
    </text>

    <text
      x="400"
      y="210"
      text-anchor="middle"
      class="symbol"
    >
      ${symbol}
    </text>

    <text
      x="400"
      y="300"
      text-anchor="middle"
      class="type"
    >
      ${type}
    </text>

    <text
      x="400"
      y="380"
      text-anchor="middle"
      class="price"
    >
      $${price}
    </text>

  </svg>
  `;

  return await sharp(
    Buffer.from(svg)
  ).png().toBuffer();
}

// إرسال صفقة جديدة
async function sendNewTrade(symbol) {

  const type =
    Math.random() > 0.5
      ? 'CALL'
      : 'PUT';

  const entry =
    (
      1.50 +
      Math.random()
    ).toFixed(2);

  const strike =
    Math.floor(
      200 + Math.random() * 300
    );

  const stop =
    (
      entry - 0.30
    ).toFixed(2);

  const target =
    (
      parseFloat(entry) + 0.80
    ).toFixed(2);

  activeTrades[symbol] = {
    symbol,
    type,
    strike,
    entry: parseFloat(entry),
    current: parseFloat(entry),
    stop: parseFloat(stop),
    target: parseFloat(target)
  };

  const image =
    await createTradeImage(
      symbol,
      type,
      entry
    );

  const text = `
🚨 صفقة جديدة

📊 السهم: ${symbol}

📈 نوع العقد: ${type}

🎯 السترايك: ${strike}

💰 سعر الدخول: $${entry}

🛑 وقف الخسارة: $${stop}

🎯 الهدف: $${target}

🔥 ST TRADE VIP
`;

  await bot.sendPhoto(
    CHAT_ID,
    image,
    {
      caption: text,
      message_thread_id: THREAD_ID
    }
  );
}

// تحديث الصفقات
async function updateTrades() {

  for (const symbol in activeTrades) {

    const trade =
      activeTrades[symbol];

    const move =
      (
        Math.random() * 0.20
      ) - 0.05;

    trade.current += move;

    trade.current =
      parseFloat(
        trade.current.toFixed(2)
      );

    const percent =
      (
        (
          (trade.current - trade.entry)
          / trade.entry
        ) * 100
      ).toFixed(2);

    // تحديث كل 0.10
    if (
      Math.abs(
        trade.current - trade.entry
      ) >= 0.10
    ) {

      const text = `
🚨 تحديث الصفقة

📊 السهم: ${trade.symbol}

📈 نوع العقد: ${trade.type}

🎯 السترايك: ${trade.strike}

💵 السعر الحالي:
$${trade.current.toFixed(2)}

📈 نسبة الربح:
${percent}%

🛑 الوقف:
$${trade.stop.toFixed(2)}

🎯 الهدف:
$${trade.target.toFixed(2)}

🔥 ST TRADE VIP
`;

      await bot.sendMessage(
        CHAT_ID,
        text,
        {
          message_thread_id:
            THREAD_ID
        }
      );

      trade.entry =
        trade.current;
    }

    // قرب الوقف
    if (
      trade.current <=
      trade.stop + 0.05 &&
      trade.current > trade.stop
    ) {

      await bot.sendMessage(
        CHAT_ID,
`
⚠️ تنبيه

الصفقة على
${trade.symbol}

اقتربت من وقف الخسارة

💵 السعر الحالي:
$${trade.current.toFixed(2)}
`,
        {
          message_thread_id:
            THREAD_ID
        }
      );
    }

    // ضرب الوقف
    if (
      trade.current <=
      trade.stop
    ) {

      await bot.sendMessage(
        CHAT_ID,
`
❌ تم ضرب وقف الخسارة

📊 ${trade.symbol}

💵 السعر:
$${trade.current.toFixed(2)}
`,
        {
          message_thread_id:
            THREAD_ID
        }
      );

      delete activeTrades[symbol];

      continue;
    }

    // تحقق الهدف
    if (
      trade.current >=
      trade.target
    ) {

      await bot.sendMessage(
        CHAT_ID,
`
✅ تحقق الهدف

📊 ${trade.symbol}

💵 السعر:
$${trade.current.toFixed(2)}

📈 الربح النهائي:
${percent}%
`,
        {
          message_thread_id:
            THREAD_ID
        }
      );

      delete activeTrades[symbol];
    }
  }
}

// تشغيل البوت
bot.onText(/\/start/, async (msg) => {

  await bot.sendMessage(
    msg.chat.id,
    '🚀 ST Signals Bot يعمل بنجاح'
  );
});

// إرسال صفقات تجريبية
setInterval(async () => {

  const symbol =
    symbols[
      Math.floor(
        Math.random() * symbols.length
      )
    ];

  if (!activeTrades[symbol]) {

    await sendNewTrade(symbol);
  }

}, 60000);

// تحديث الصفقات
setInterval(
  updateTrades,
  30000
);

console.log(
  '🚀 ST Signals Bot Started'
);
