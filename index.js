const Telegraf = require('telegraf');
const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const Markup = require('telegraf/markup');


const messages = require('./modules/Messages');
const commands = require('./modules/Commands');
const JsonService = require('./modules/JsonService');

const ParseService = require('./modules/ParseService');

require('dotenv').config();
const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Stage();

const addNewMonitoringScene = new Scene(commands.addNewMonitoringScene);
stage.register(addNewMonitoringScene);

const removeMonitoringScene = new Scene(commands.removeMonitoringScene);
stage.register(removeMonitoringScene);

bot.use(session());
bot.use(stage.middleware());

const usersJsonService = new JsonService('users');
const logsJsonService = new JsonService('logs');

const controls = (ctx) => {
    ctx.reply(messages.controlsButtons, Markup.inlineKeyboard([
        [
            Markup.callbackButton(messages.addNewMonitoringButton, commands.addNewMonitoringAction)
        ],
        [
            Markup.callbackButton(messages.removeMonitoringButton, commands.removeMonitoringAction)
        ],
        [
            Markup.callbackButton(messages.removeAllMonitoringsButton, commands.removeAllMonitoringsAction)
        ],
        [
            Markup.callbackButton(messages.showMonitoringsButton, commands.showMonitoringsAction)
        ],
        [
            Markup.callbackButton(messages.runSearchButton, commands.runSearchAction)
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

bot.command(commands.controls, ctx => controls(ctx));

bot.action(commands.addNewMonitoringAction, (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(messages.addNewMonitoringQuestion);
    ctx.scene.enter(commands.addNewMonitoringScene);
});

bot.action(commands.removeMonitoringAction, (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(messages.removeMonitoringQuestion);
    ctx.scene.enter(commands.removeMonitoringScene);
});

bot.action(commands.showMonitoringsAction, (ctx) => {
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

bot.action(commands.runSearchAction, (ctx) => {
    ctx.answerCbQuery();

    const parseService = new ParseService(ctx.from.id);
    parseService
        .search()
        .then(queryResults => {
            const messagesArray = [];

            queryResults.forEach(queryResult => {
                let message = `<b>${queryResult.query}</b>
`;

                if (queryResult.result.length === 0) {
                    message += `
${messages.noSearchResult}
`;
                }

                queryResult.result.forEach(item => {
                    if (message.length <= 4096) {
                        message += `
<a href="${item.link}">${item.title}</a>
`;
                    } else {
                        messagesArray.push(message);
                        message = '';
                    }
                });

                messagesArray.push(message);
            });

            messagesArray.forEach(message => {
                ctx.replyWithHTML(message, {
                    disable_web_page_preview: true,
                    disable_notification: true
                });
            });
        });
});

bot.action(commands.removeAllMonitoringsAction, (ctx) => {
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

    ctx.scene.leave(commands.addNewMonitoringScene);
});

removeMonitoringScene.on('text', (ctx) => {
    ctx.session.monitoringToRemove = ctx.message.text;

    const update = usersJsonService.readJsonFile(ctx.from.id);
    update.monitorings = update.monitorings.filter(
        monitoring => monitoring.toLowerCase() !== ctx.session.monitoringToRemove.toLowerCase()
    );
    usersJsonService.writeJsonFile(ctx.from.id, update);

    ctx.reply(`✅ "${ctx.session.monitoringToRemove}" ${messages.removedMonitoring}`);

    ctx.scene.leave(commands.removeMonitoringScene);
});

bot.startPolling();
