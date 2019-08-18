const Telegraf = require('telegraf');
const Markup = require('telegraf/markup');

require('dotenv').config();

const messages = require('./modules/Messages');
const JsonService = require('./modules/JsonService');


const bot = new Telegraf(process.env.BOT_TOKEN);
const usersJsonService = new JsonService('users');


bot.start((ctx) => {
  usersJsonService.writeJsonFile(ctx.from.id, {
    fullName: `${ctx.from.first_name} ${ctx.from.last_name}`,
    monitorings: []
  });
  return ctx.reply(messages.startMessage);
});

bot.command('monitoring', (ctx) => {
  ctx.reply('Choose your command below:', Markup.inlineKeyboard([
    Markup.callbackButton('Show monitoring list', 'showList'),
    Markup.callbackButton('Add new monitoring', 'addNewMonitoring')
  ]).extra());
});

bot.action('showList', (ctx) => {
  const list = usersJsonService.readJsonFile(ctx.from.id).monitorings.length ? usersJsonService.readJsonFile(ctx.from.id).monitorings : 'no monitorings';
  ctx.reply(list);
});

bot.action('addNewMonitoring', (ctx) => {
  ctx.reply('What do want to monitor?');
  bot.on('message', (ctx) => {
    console.log(ctx.messages);
  });
});

bot.launch();

// const addNewMonitoring = (msg) => {
//     const chatId = chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id;
//     const message = `Monitoring name:`;
//     const options = {
//         reply_markup: {
//             force_reply: true
//         }
//     };


//     bot.sendMessage(chatId, message, options);
// };

// const dataHandler = (msg) => {
//     switch (msg.data) {
//         case 'addNewMonitoring':
//             addNewMonitoring(msg);
//             break;
//     }
// };

// bot.onText(/\/start/, msg => {
//     const chatId = chat = msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id;


//     bot.sendMessage(chatId, message);
// });




//     bot.sendMessage(chatId, message, options);
// });

// bot.on('callback_query', function (msg) {
//     const userId = msg.from.id;

//     createFile(userId);
//     dataHandler(msg);
// });

// bot.onText(/\/search/, msg => {
//     search().then(() => {
//         const chatId = msg.chat.id;

//         if (result.length === 0) {
//             bot.sendMessage(chatId, 'no result');
//         }

//         result.forEach(item => {
//             bot.sendMessage(chatId, `<a href="${item.link}">${item.title}</a>`, {
//                 parse_mode: 'html',
//                 disable_web_page_preview: false
//             });
//         });
//     });
// });
