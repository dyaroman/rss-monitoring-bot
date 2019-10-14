const Telegraf = require('telegraf');
const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const Markup = require('telegraf/markup');
const mongo = require('mongodb').MongoClient;
require('dotenv').config();


const messages = require('./data/Messages');
const commands = require('./data/Commands');
const RssService = require('./services/RssService');
const MonitoringService = require('./services/MonitoringService');
let db;

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Stage();
const addNewMonitoringScene = new Scene(commands.addNewMonitoringScene);
const removeMonitoringScene = new Scene(commands.removeMonitoringScene);

stage.register(addNewMonitoringScene);
stage.register(removeMonitoringScene);

bot.use(session());
bot.use(stage.middleware());

mongo.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, (err, client) => {
    if (err) {
        sendError(err);
    }

    db = client.db('rss_monitoring_bot');
    bot.startPolling();
    new MonitoringService(db);
});


bot.start((ctx) => {
    const USER_ID = ctx.from.id;

    db.collection('users').updateOne(
        {_id: USER_ID},
        {
            $setOnInsert: {
                monitorings: []
            }
        },
        {upsert: true}
    );

    db.collection('logs').updateOne(
        {_id: USER_ID},
        {
            $setOnInsert: {
                username: ctx.from.username,
                fullName: `${ctx.from.first_name} ${ctx.from.last_name}`,
                history: [],
            }
        },
        {upsert: true}
    );

    return ctx.reply(messages.start);
});

bot.command(commands.controls, (ctx) => controls(ctx));

bot.action(commands.addNewMonitoring, (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(messages.addNewMonitoringQuestion);
    ctx.scene.enter(commands.addNewMonitoringScene);
});

addNewMonitoringScene.on('text', (ctx) => {
    addNewMonitoring(ctx, ctx.message.text);

    ctx.scene.leave(commands.addNewMonitoringScene);
});

bot.command(commands.addNewMonitoring, (ctx) => {
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

bot.action(commands.removeMonitoring, async (ctx) => {
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').findOne({_id: USER_ID});
    const monitorings = currentUser.monitorings;

    ctx.answerCbQuery();

    if (monitorings.length) {
        ctx.reply(messages.removeMonitoringQuestion);
        ctx.scene.enter(commands.removeMonitoringScene);
    } else {
        ctx.reply(messages.noActiveMonitorings);
    }
});

removeMonitoringScene.on('text', (ctx) => {
    removeMonitoring(ctx, ctx.message.text);

    ctx.scene.leave(commands.removeMonitoringScene);
});

bot.command(commands.removeMonitoring, (ctx) => {
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

bot.action(commands.removeAllMonitorings, (ctx) => {
    ctx.answerCbQuery();
    removeAllMonitorings(ctx);
});

bot.command(commands.removeAllMonitorings, (ctx) => {
    removeAllMonitorings(ctx);
});

bot.action(commands.showMonitorings, (ctx) => {
    ctx.answerCbQuery();
    showMonitorings(ctx);
});

bot.command(commands.showMonitorings, (ctx) => {
    showMonitorings(ctx);
});

bot.action(commands.runSearch, (ctx) => {
    ctx.answerCbQuery();
    runSearch(ctx);
});

bot.command(commands.runSearch, (ctx) => {
    runSearch(ctx);
});

function controls(ctx) {
    ctx.reply(messages.controlsButtons, Markup.inlineKeyboard([
        [
            Markup.callbackButton(messages.addNewMonitoringButton, commands.addNewMonitoring)
        ],
        [
            Markup.callbackButton(messages.removeMonitoringButton, commands.removeMonitoring)
        ],
        [
            Markup.callbackButton(messages.removeAllMonitoringsButton, commands.removeAllMonitorings)
        ],
        [
            Markup.callbackButton(messages.showMonitoringsButton, commands.showMonitorings)
        ],
        [
            Markup.callbackButton(messages.runSearchButton, commands.runSearch)
        ]
    ])
        .oneTime()
        .resize()
        .extra());
}

async function addNewMonitoring(ctx, query) {
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').findOne({_id: USER_ID});
    const monitorings = currentUser.monitorings;

    db.collection('logs').updateOne(
        {_id: USER_ID},
        {$push: {history: query}}
    );

    if (!monitorings.map(item => item.toLowerCase()).includes(query.toLowerCase())) {
        db.collection('users').updateOne(
            {_id: USER_ID},
            {$push: {monitorings: query}}
        );

        ctx.reply(`✅ "${query}" ${messages.addedNewMonitoring}`);
    } else {
        ctx.reply(`❎ "${query}" ${messages.existedMonitoring}`);
    }
}

async function removeMonitoring(ctx, query) {
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').findOne({_id: USER_ID});
    const monitorings = currentUser.monitorings;

    if (monitorings.map(item => item.toLowerCase()).includes(query.toLowerCase())) {
        db.collection('users').updateOne(
            {_id: USER_ID},
            {$pull: {monitorings: new RegExp(query, 'i')}}
        );

        ctx.reply(`✅ "${query}" ${messages.removedMonitoring}`);
    } else {
        ctx.reply(`❎ "${query}" ${messages.monitoringNotFound}`);
    }
}

async function removeAllMonitorings(ctx) {
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').findOne({_id: USER_ID});
    const monitorings = currentUser.monitorings;

    if (monitorings.length) {
        db.collection('users').updateOne(
            {_id: USER_ID},
            {$set: {monitorings: []}}
        );

        return ctx.reply(messages.allMonitoringsRemoved);
    } else {
        return ctx.reply(messages.noActiveMonitorings);
    }
}

async function showMonitorings(ctx) {
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').findOne({_id: USER_ID});
    const monitorings = currentUser.monitorings;

    if (monitorings.length) {
        let message = `<b>Your have ${monitorings.length} active monitoring${monitorings.length > 1 ? 's' : ''}:</b>\n\n`;
        monitorings.forEach((item, i) => {
            message += `${++i}. ${item}\n`;
        });
        return ctx.replyWithHTML(message);
    } else {
        return ctx.reply(messages.noActiveMonitorings);
    }
}

function runSearch(ctx) {
    const USER_ID = ctx.from.id;
    db.collection('users').findOne({_id: USER_ID}).then(user => {
        const monitorings = user.monitorings;

        if (!monitorings.length) {
            return ctx.reply(messages.noActiveMonitorings);
        }

        new RssService(monitorings)
            .search()
            .then(queryResults => sendSearchResults(ctx, queryResults));
    });
}

async function sendSearchResults(ctx, resultsArray) {
    const messagesArray = [];

    resultsArray.forEach(result => {
        let message = '';

        if (result.results.length === 0) {
            message += `${messages.noSearchResult} "<b>${result.query}</b>".`;
        } else {
            message += `I found ${result.results.length} results for your request "<b>${result.query}</b>":\n\n`;

            result.results.forEach(item => {
                if (message.length <= 4096) {
                    message += `<a href="${item.link}">${item.title}</a>\n\n`;
                } else {
                    messagesArray.push(message);
                    message = '';
                }
            });
        }

        messagesArray.push(message);
    });

    for (let i = 0; i < messagesArray.length; i++) {
        await ctx.replyWithHTML(messagesArray[i], {
            disable_web_page_preview: true,
            disable_notification: true
        });
    }
}

function sendError(message, options) {
    bot.telegram.sendMessage(process.env.DEV_ID, message, options);
}
