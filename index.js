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
    ctx.reply(messages.controlsButtons, Markup.inlineKeyboard([
        [
            Markup.callbackButton(messages.addNewMonitoringButton, 'addNewMonitoring')
        ],
        [
            Markup.callbackButton(messages.removeMonitoringButton, 'removeMonitoring')
        ],
        [
            Markup.callbackButton(messages.removeAllMonitoringsButton, 'removeAllMonitorings')
        ],
        [
            Markup.callbackButton(messages.showMonitoringsButton, 'showMonitorings')
        ],
        [
            Markup.callbackButton(messages.runSearchButton, 'runSearch')
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
    return ctx.reply(messages.start);
});

bot.command('controls', ctx => controls(ctx));

bot.action('addNewMonitoring', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(messages.addNewMonitoringQuestion);
    ctx.scene.enter('addNewMonitoringScene');
});

bot.action('removeMonitoring', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(messages.removeMonitoringQuestion);
    ctx.scene.enter('removeMonitoringScene');
});

bot.action('showMonitorings', (ctx) => {
    ctx.answerCbQuery();
    const list = usersJsonService.readJsonFile(ctx.from.id).monitorings;
    if (list.length) {
        let message = '';
        list.forEach(item => {
            message += `👀 ${item}
`;
        });
        return ctx.reply(message);
    } else {
        return ctx.reply(messages.noActiveMonitorings);
    }
});

bot.action('runSearch', (ctx) => {
    ctx.answerCbQuery();

    const parseService = new ParseService(ctx.from.id);
    parseService
        .search()
        .then(queryResults => {
            queryResults.forEach(queryResult => {
                let message = `<b>${queryResult.query}</b>
`;

                if (queryResult.result.length === 0) {
                    message += `
${messages.noSearchResult}
`;
                }

                queryResult.result.forEach(item => {
                    message += `
<a href="${item.link}">${item.title}</a>
`;
                });

                //todo max message length is 4096 UTF-8 characters
                ctx.replyWithHTML(message, {
                    disable_web_page_preview: true,
                    disable_notification: true
                });
            });
        });
});

bot.action('removeAllMonitorings', (ctx) => {
    ctx.answerCbQuery();

    const update = usersJsonService.readJsonFile(ctx.from.id);
    update.monitorings = [];
    usersJsonService.writeJsonFile(ctx.from.id, update);

    ctx.reply(messages.allMonitoringsRemoved);
});

addNewMonitoringScene.on('text', (ctx) => {
    ctx.session.newMonitoring = ctx.message.text;

    const update = usersJsonService.readJsonFile(ctx.from.id);
    update.monitorings.push(ctx.session.newMonitoring);
    usersJsonService.writeJsonFile(ctx.from.id, update);

    const logs = logsJsonService.readJsonFile(ctx.from.id);
    logs.monitoringsHistory.push(ctx.session.newMonitoring);
    logsJsonService.writeJsonFile(ctx.from.id, logs);

    ctx.reply(`✅ "${ctx.session.newMonitoring}" ${messages.addedNewMonitoring}`);

    ctx.scene.leave('addNewMonitoringScene');
});

removeMonitoringScene.on('text', (ctx) => {
    ctx.session.monitoringToRemove = ctx.message.text;

    const update = usersJsonService.readJsonFile(ctx.from.id);
    update.monitorings = update.monitorings.filter(
        monitoring => monitoring.toLowerCase() !== ctx.session.monitoringToRemove.toLowerCase()
    );
    usersJsonService.writeJsonFile(ctx.from.id, update);

    ctx.reply(`✅ "${ctx.session.monitoringToRemove}" ${messages.removedMonitoring}`);

    ctx.scene.leave('removeMonitoringScene');
});

bot.startPolling();
