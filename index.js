const Telegraf = require('telegraf');
const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const Markup = require('telegraf/markup');
const mongo = require('mongodb').MongoClient;
require('dotenv').config();

const messages = require('./src/data/Messages');
const commands = require('./src/data/Commands');
const RssService = require('./src/services/RssService');
const MonitoringService = require('./src/services/MonitoringService');
let db;

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Stage();
const addNewMonitoringScene = new Scene(commands.addNewMonitoringScene);
const removeMonitoringScene = new Scene(commands.removeMonitoringScene);

const SearchResults = require('./src/services/SearchResults');
const searchResults = new SearchResults(bot, true);

stage.register(addNewMonitoringScene);
stage.register(removeMonitoringScene);

bot.use(session());
bot.use(stage.middleware());

mongo.connect(
    process.env.MONGODB_URL,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    async (err, client) => {
        if (err) {
            await sendError(err);
        }

        db = client.db('rss_monitoring_bot');
        bot.startPolling();
        new MonitoringService(db);
    },
);

bot.start((ctx) => {
    const USER_ID = ctx.from.id;

    db.collection('users').updateOne(
        {_id: USER_ID},
        {
            $setOnInsert: {
                monitorings: [],
            },
        },
        {upsert: true},
    );

    db.collection('logs').updateOne(
        {_id: USER_ID},
        {
            $setOnInsert: {
                username: ctx.from.username,
                fullName: `${ctx.from.first_name} ${ctx.from.last_name}`,
                history: [],
            },
        },
        {upsert: true},
    );

    return ctx.reply(messages.start);
});

bot.command(commands.controls, (ctx) => controls(ctx));

bot.action(commands.addNewMonitoring, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(messages.addNewMonitoringQuestion);
    ctx.scene.enter(commands.addNewMonitoringScene);
});

addNewMonitoringScene.on('text', async (ctx) => {
    await addNewMonitoring(ctx, ctx.message.text);

    await ctx.scene.leave();
});

bot.command(commands.addNewMonitoring, async (ctx) => {
    const arguments = ctx.message.text
        .trim()
        .split(' ')
        .slice(1);

    if (arguments.length) {
        await addNewMonitoring(ctx, arguments.join(' '));
    } else {
        await ctx.reply(messages.addNewMonitoringQuestion);
        ctx.scene.enter(commands.addNewMonitoringScene);
    }
});

bot.action(commands.removeMonitoring, async (ctx) => {
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').findOne({_id: USER_ID});
    const monitorings = currentUser.monitorings;

    await ctx.answerCbQuery();

    if (monitorings.length) {
        await ctx.reply(messages.removeMonitoringQuestion);
        ctx.scene.enter(commands.removeMonitoringScene);
    } else {
        await ctx.reply(messages.noActiveMonitorings);
    }
});

removeMonitoringScene.on('text', async (ctx) => {
    await removeMonitoring(ctx, ctx.message.text);

    await ctx.scene.leave();
});

bot.command(commands.removeMonitoring, async (ctx) => {
    const arguments = ctx.message.text
        .trim()
        .split(' ')
        .slice(1);

    if (arguments.length) {
        await removeMonitoring(ctx, arguments.join(' '));
    } else {
        await ctx.reply(messages.removeMonitoringQuestion);
        ctx.scene.enter(commands.removeMonitoringScene);
    }
});

bot.action(commands.removeAllMonitorings, async (ctx) => {
    await ctx.answerCbQuery();
    confirmRemoveAllMonitorings(ctx);
});

bot.command(commands.removeAllMonitorings, (ctx) => {
    confirmRemoveAllMonitorings(ctx);
});

bot.action(commands.removeAllMonitoringsConfirmed, async (ctx) => {
    await ctx.answerCbQuery();
    await removeAllMonitorings(ctx);
});

bot.action(commands.showMonitorings, async (ctx) => {
    await ctx.answerCbQuery();
    await showMonitorings(ctx);
});

bot.command(commands.showMonitorings, async (ctx) => {
    await showMonitorings(ctx);
});

bot.action(commands.runSearch, async (ctx) => {
    await ctx.answerCbQuery();
    runSearch(ctx);
});

bot.command(commands.runSearch, (ctx) => {
    runSearch(ctx);
});

function controls(ctx) {
    ctx.reply(
        messages.controlsButtons,
        Markup.inlineKeyboard([
            [Markup.callbackButton(messages.addNewMonitoringButton, commands.addNewMonitoring)],
            [Markup.callbackButton(messages.removeMonitoringButton, commands.removeMonitoring)],
            [Markup.callbackButton(messages.removeAllMonitoringsButton, commands.removeAllMonitorings)],
            [Markup.callbackButton(messages.showMonitoringsButton, commands.showMonitorings)],
            [Markup.callbackButton(messages.runSearchButton, commands.runSearch)],
        ])
            .oneTime()
            .resize()
            .extra(),
    );
}

async function addNewMonitoring(ctx, query) {
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').findOne({_id: USER_ID});
    const monitorings = currentUser.monitorings;

    db.collection('logs').updateOne({_id: USER_ID}, {$push: {history: query}});

    if (monitorings.map((item) => item.toLowerCase()).includes(query.toLowerCase())) {
        ctx.reply(messages.existedMonitoring.replace('{{query}}', query));
    } else {
        db.collection('users').updateOne({_id: USER_ID}, {$push: {monitorings: query}});

        ctx.reply(messages.addedNewMonitoring.replace('{{query}}', query));
    }
}

async function removeMonitoring(ctx, query) {
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').findOne({_id: USER_ID});
    const monitorings = currentUser.monitorings;

    if (monitorings.map((item) => item.toLowerCase()).includes(query.toLowerCase())) {
        db.collection('users').updateOne({_id: USER_ID}, {$pull: {monitorings: new RegExp(query, 'i')}});

        ctx.reply(messages.removedMonitoring.replace('{{query}}', query));
    } else {
        ctx.reply(messages.monitoringNotFound.replace('{{query}}', query));
    }
}

function confirmRemoveAllMonitorings(ctx) {
    ctx.reply(
        messages.confirmRemoveAllMonitorings,
        Markup.inlineKeyboard([
            [Markup.callbackButton('Yes, remove all', commands.removeAllMonitoringsConfirmed)]
        ])
            .oneTime()
            .resize()
            .extra(),
    );
}

async function removeAllMonitorings(ctx) {
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').findOne({_id: USER_ID});
    const monitorings = currentUser.monitorings;

    if (monitorings.length) {
        await db.collection('users').updateOne({_id: USER_ID}, {$set: {monitorings: []}});

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
        let message = messages.allMonitoringsAmountTitle.replace('{{amount}}', monitorings.length);

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
    db.collection('users')
        .findOne({_id: USER_ID})
        .then((user) => {
            const monitorings = user.monitorings;

            if (monitorings.length) {
                ctx.reply(messages.searchBegin);
            } else {
                return ctx.reply(messages.noActiveMonitorings);
            }

            new RssService(monitorings).search()
                .then((queryResults) => searchResults.send(USER_ID, queryResults));
        });
}

async function sendError(message) {
    await bot.telegram.sendMessage(process.env.DEV_ID, message);
}
