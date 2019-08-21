const Telegraf = require('telegraf');
const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const Markup = require('telegraf/markup');
require('dotenv').config();


const messages = require('./modules/Messages');
const commands = require('./modules/Commands');
const JsonService = require('./modules/JsonService');
const ParseService = require('./modules/ParseService');


const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Stage();
const addNewMonitoringScene = new Scene(commands.addNewMonitoringScene);
const removeMonitoringScene = new Scene(commands.removeMonitoringScene);

stage.register(addNewMonitoringScene);
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

const addNewMonitoring = (ctx, query) => {
    const USER_ID = ctx.from.id;

    ctx.session.newMonitoring = query;

    const logs = logsJsonService.readJsonFile(USER_ID);
    logs.monitoringsHistory.push(ctx.session.newMonitoring);
    logsJsonService.writeJsonFile(USER_ID, logs);

    const update = usersJsonService.readJsonFile(USER_ID);
    if (!update.monitorings.map(item => item.toLowerCase()).includes(ctx.session.newMonitoring.toLowerCase())) {
        update.monitorings.push(ctx.session.newMonitoring);
        usersJsonService.writeJsonFile(USER_ID, update);
        ctx.reply(`✅ "${ctx.session.newMonitoring}" ${messages.addedNewMonitoring}`);
    } else {
        ctx.reply(`❎ "${ctx.session.newMonitoring}" ${messages.existedMonitoring}`);
    }
};

const removeMonitoring = (ctx, query) => {
    const USER_ID = ctx.from.id;

    ctx.session.monitoringToRemove = query;

    const update = usersJsonService.readJsonFile(USER_ID);
    if (update.monitorings.includes(query)) {
        update.monitorings = update.monitorings.filter(
            monitoring => monitoring.toLowerCase() !== ctx.session.monitoringToRemove.toLowerCase()
        );
        usersJsonService.writeJsonFile(USER_ID, update);

        ctx.reply(`✅ "${ctx.session.monitoringToRemove}" ${messages.removedMonitoring}`);
    } else {
        ctx.reply(`❎ "${ctx.session.monitoringToRemove}" ${messages.monitoringNotFound}`);
    }
};

const removeAllMonitorings = (ctx) => {
    const update = usersJsonService.readJsonFile(ctx.from.id);
    update.monitorings = [];
    usersJsonService.writeJsonFile(ctx.from.id, update);

    ctx.reply(messages.allMonitoringsRemoved);
};

const showMonitorings = (ctx) => {
    const list = usersJsonService.readJsonFile(ctx.from.id).monitorings;
    if (list.length) {
        let message = '<b>Your active monitorings:</b>\n\n';
        list.forEach(item => {
            message += `${item}\n`;
        });
        return ctx.replyWithHTML(message);
    } else {
        return ctx.reply(messages.noActiveMonitorings);
    }
};

const runSearch = (ctx) => {
    const monitorings = usersJsonService.readJsonFile(ctx.from.id).monitorings;
    if (!monitorings.length) {
        return ctx.reply(messages.noActiveMonitorings);
    }

    const parseService = new ParseService(ctx.from.id);
    parseService
        .search()
        .then(queryResults => {
            const messagesArray = [];

            queryResults.forEach(queryResult => {
                let message = `<b>${queryResult.query}:</b>\n\n`;

                if (queryResult.result.length === 0) {
                    message += `${messages.noSearchResult}\n`;
                }

                queryResult.result.forEach(item => {
                    if (message.length <= 4096) {
                        message += `<a href="${item.link}">${item.title}</a>\n\n`;
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
};

bot.start((ctx) => {
    const USER_ID = ctx.from.id;

    const initialUserData = usersJsonService.readJsonFile(USER_ID);
    if (initialUserData) {
        usersJsonService.writeJsonFile(USER_ID, {
            monitorings: initialUserData.monitorings
        });
    } else {
        usersJsonService.writeJsonFile(USER_ID, {
            monitorings: []
        });
    }

    const initialLogs = logsJsonService.readJsonFile(USER_ID);
    if (initialLogs) {
        logsJsonService.writeJsonFile(USER_ID, {
            fullName: initialLogs.fullName,
            username: initialLogs.username,
            monitoringsHistory: initialLogs.monitoringsHistory
        });
    } else {
        logsJsonService.writeJsonFile(USER_ID, {
            fullName: `${ctx.from.first_name} ${ctx.from.last_name}`,
            username: ctx.from.username,
            monitoringsHistory: []
        });
    }

    return ctx.reply(messages.start);
});

bot.command(commands.controls, ctx => controls(ctx));

bot.action(commands.addNewMonitoringAction, (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(messages.addNewMonitoringQuestion);
    ctx.scene.enter(commands.addNewMonitoringScene);
});

addNewMonitoringScene.on('text', (ctx) => {
    addNewMonitoring(ctx, ctx.message.text);

    ctx.scene.leave(commands.addNewMonitoringScene);
});

bot.command('add', (ctx) => {
    const [command, ...arguments] = ctx.message.text
        .trim()
        .split(' ');

    if (arguments.length) {
        addNewMonitoring(ctx, arguments.join(' '));
    } else {
        ctx.reply(messages.addNewMonitoringQuestion);
        ctx.scene.enter(commands.addNewMonitoringScene);
    }
});

bot.action(commands.removeMonitoringAction, (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(messages.removeMonitoringQuestion);
    ctx.scene.enter(commands.removeMonitoringScene);
});

removeMonitoringScene.on('text', (ctx) => {
    removeMonitoring(ctx, ctx.message.text);

    ctx.scene.leave(commands.removeMonitoringScene);
});

bot.command('remove', (ctx) => {
    const [command, ...arguments] = ctx.message.text
        .trim()
        .split(' ');

    if (arguments.length) {
        removeMonitoring(ctx, arguments.join(' '));
    } else {
        ctx.reply(messages.removeMonitoringQuestion);
        ctx.scene.enter(commands.removeMonitoringScene);
    }
});

bot.action(commands.removeAllMonitoringsAction, (ctx) => {
    ctx.answerCbQuery();
    removeAllMonitorings(ctx);
});

bot.command('removeAll', (ctx) => {
    removeAllMonitorings(ctx);
});

bot.action(commands.showMonitoringsAction, (ctx) => {
    ctx.answerCbQuery();
    showMonitorings(ctx);
});

bot.command('show', (ctx) => {
    showMonitorings(ctx);
});

bot.action(commands.runSearchAction, (ctx) => {
    ctx.answerCbQuery();
    runSearch(ctx);
});

bot.command('search', (ctx) => {
    runSearch(ctx);
});


bot.startPolling();
