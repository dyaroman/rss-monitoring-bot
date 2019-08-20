const Telegraf = require('telegraf');
const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const Markup = require('telegraf/markup');


const messages = require('./modules/Messages');
const JsonService = require('./modules/JsonService');

const ParseService = require('./modules/ParseService');

require('dotenv').config();
const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Stage();

const addNewMonitoringScene = new Scene('addNewMonitoringScene');
stage.register(addNewMonitoringScene);

const removeMonitoringScene = new Scene('removeMonitoringScene');
stage.register(removeMonitoringScene);

bot.use(session());
bot.use(stage.middleware());

const usersJsonService = new JsonService('users');
const logsJsonService = new JsonService('logs');

const controls = (ctx) => {
    ctx.reply('Choose your command below:', Markup.inlineKeyboard([
        [
            Markup.callbackButton('Add new monitoring ✅', 'addNewMonitoring')
        ],
        [
            Markup.callbackButton('Remove monitoring ❌', 'removeMonitoring')
        ],
        [
            Markup.callbackButton('Remove all monitorings 🧨', 'removeAllMonitorings')
        ],
        [
            Markup.callbackButton('Show monitorings 📜', 'showMonitorings')
        ],
        [
            Markup.callbackButton('Run search 🚀', 'runSearch')
        ]
    ])
        .oneTime()
        .resize()
        .extra());
};

bot.start((ctx) => {
    usersJsonService.writeJsonFile(ctx.from.id, {
        monitorings: []
    });
    logsJsonService.writeJsonFile(ctx.from.id, {
        fullName: `${ctx.from.first_name} ${ctx.from.last_name}`,
        username: ctx.from.username,
        monitoringsHistory: []
    });
    return ctx.reply(messages.startMessage);
});

bot.command('monitoring', ctx => controls(ctx));

bot.action('addNewMonitoring', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('What do want to monitor?');
    ctx.scene.enter('addNewMonitoringScene');
});

bot.action('removeMonitoring', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('What monitoring do want to remove?');
    ctx.scene.enter('removeMonitoringScene');
});

bot.action('showMonitorings', (ctx) => {
    ctx.answerCbQuery();
    const list = usersJsonService.readJsonFile(ctx.from.id).monitorings;
    if (list.length) {
        let message = '';
        list.forEach(item => {
            message += `${item}
`;
        });
        return ctx.reply(message);
    } else {
        return ctx.reply('no monitorings');
    }
});

bot.action('runSearch', (ctx) => {
    ctx.answerCbQuery();

    const parseService = new ParseService(ctx.from.id);
    parseService
        .search()
        .then(result => {
            if (result.length === 0) {
                return ctx.reply('no result');
            }
            result.forEach(item => {
                return ctx.replyWithHTML(`<a href="${item.link}">${item.title}</a>`, {
                    disable_web_page_preview: true
                });
            });
        });
});

bot.action('removeAllMonitorings', (ctx) => {
    ctx.answerCbQuery();

    const update = usersJsonService.readJsonFile(ctx.from.id);
    update.monitorings = [];
    usersJsonService.writeJsonFile(ctx.from.id, update);

    ctx.reply(`All monitorings removed!`);
});

addNewMonitoringScene.on('text', (ctx) => {
    ctx.session.newMonitoring = ctx.message.text;

    const update = usersJsonService.readJsonFile(ctx.from.id);
    update.monitorings.push(ctx.session.newMonitoring);
    usersJsonService.writeJsonFile(ctx.from.id, update);

    const logs = logsJsonService.readJsonFile(ctx.from.id);
    logs.monitoringsHistory.push(ctx.session.newMonitoring);
    logsJsonService.writeJsonFile(ctx.from.id, logs);

    ctx.reply(`Added new monitoring "${ctx.session.newMonitoring}"!`);

    ctx.scene.leave('addNewMonitoringScene');
});

removeMonitoringScene.on('text', (ctx) => {
    ctx.session.monitoringToRemove = ctx.message.text;

    const update = usersJsonService.readJsonFile(ctx.from.id);
    update.monitorings = update.monitorings.filter(
        monitoring => monitoring.toLowerCase() !== ctx.session.monitoringToRemove.toLowerCase()
    );
    usersJsonService.writeJsonFile(ctx.from.id, update);

    ctx.reply(`Monitoring "${ctx.session.monitoringToRemove}" removed!`);

    ctx.scene.leave('removeMonitoringScene');
});

bot.startPolling();