import Telegraf from 'telegraf';
import Scene from 'telegraf/scenes/base';
import Stage from 'telegraf/stage';
import session from 'telegraf/session';
import Markup from 'telegraf/markup';
import MongoClient from 'mongodb';
import dotenv from 'dotenv';

import {messages} from './data/messages';
import {commands} from './data/commands';
import {MonitoringService} from './services/MonitoringService';
import {LogService} from './services/LogService';

dotenv.config();
const logService = new LogService();
let db;
const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Stage();
const addNewMonitoringScene = new Scene(commands.addNewMonitoringScene);
const removeMonitoringScene = new Scene(commands.removeMonitoringScene);

stage.register(addNewMonitoringScene);
stage.register(removeMonitoringScene);

bot.use(session());
bot.use(stage.middleware());

MongoClient.connect(
    process.env.MONGODB_URL,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    async (err, client) => {
        if (err) {
            await sendToAdmin(err);
        }

        db = client.db('rss_monitoring_bot');

        bot.startPolling();
        logService.init(db);
        new MonitoringService(db, logService);
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

    logService.start(ctx);

    return ctx.reply(messages.start);
});

addNewMonitoringScene.on('text', async (ctx) => {
    await addNewMonitoring(ctx, ctx.message.text);

    await ctx.scene.leave();
});

bot.command(commands.addNewMonitoring, async (ctx) => {
    const args = ctx.message.text
        .trim()
        .split(' ')
        .slice(1);

    if (args.length) {
        await addNewMonitoring(ctx, args.join(' '));
    } else {
        await ctx.reply(messages.addNewMonitoringQuestion);
        ctx.scene.enter(commands.addNewMonitoringScene);
    }
});

removeMonitoringScene.on('text', async (ctx) => {
    await removeMonitoring(ctx, ctx.message.text);

    await ctx.scene.leave();
});

bot.command(commands.removeMonitoring, async (ctx) => {
    const args = ctx.message.text
        .trim()
        .split(' ')
        .slice(1);

    if (args.length) {
        await removeMonitoring(ctx, args.join(' '));
    } else {
        await ctx.reply(messages.removeMonitoringQuestion);
        ctx.scene.enter(commands.removeMonitoringScene);
    }
});

bot.command(commands.removeAllMonitorings, (ctx) => {
    confirmRemoveAllMonitorings(ctx);
});

bot.action(commands.removeAllMonitoringsConfirmed, async (ctx) => {
    await ctx.answerCbQuery();
    await removeAllMonitorings(ctx);
});

bot.command(commands.showMonitorings, async (ctx) => {
    await showMonitorings(ctx);
});

async function addNewMonitoring(ctx, query) {
    query = query.trim();
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').findOne({_id: USER_ID});
    const monitorings = currentUser.monitorings;

    logService.log(USER_ID, {
        action: 'add',
        monitoring: query,
    });

    if (monitorings.map((item) => item.toLowerCase()).includes(query.toLowerCase())) {
        ctx.reply(messages.existedMonitoring.replace('{{query}}', query));
    } else {
        db.collection('users').updateOne({_id: USER_ID}, {$push: {monitorings: query}});

        ctx.reply(messages.addedNewMonitoring.replace('{{query}}', query));
    }
}

async function removeMonitoring(ctx, query) {
    query = query.trim();
    let monitoringToRemove = query;
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').findOne({_id: USER_ID});
    const monitorings = currentUser.monitorings;
    const arrayFromQuery = query.trim().split(' ');
    const monitoringListNumber = parseInt(arrayFromQuery[0], 10);

    if (arrayFromQuery.length === 1 && monitoringListNumber) {
        monitoringToRemove = monitorings[monitoringListNumber - 1] ? monitorings[monitoringListNumber - 1] : query;
    }

    logService.log(USER_ID, {
        action: 'remove',
        monitoring: monitoringToRemove,
    });

    if (monitorings
        .map((item) => item.toLowerCase())
        .includes(monitoringToRemove.toLowerCase())
    ) {
        db.collection('users').updateOne(
            {_id: USER_ID},
            {
                $pull: {
                    monitorings: new RegExp(`^${monitoringToRemove}$`, 'i'),
                },
            },
        );

        ctx.reply(messages.removedMonitoring.replace('{{query}}', monitoringToRemove));
    } else {
        ctx.reply(messages.monitoringNotFound.replace('{{query}}', monitoringToRemove));
    }
}

function confirmRemoveAllMonitorings(ctx) {
    ctx.reply(
        messages.confirmRemoveAllMonitorings,
        Markup.inlineKeyboard([
            [Markup.callbackButton(messages.confirmRemoveAllMonitoringButton, commands.removeAllMonitoringsConfirmed)],
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

    logService.log(USER_ID, {
        action: 'remove_all',
    });

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

    logService.log(USER_ID, {
        action: 'show',
    });

    if (monitorings.length) {
        let message = messages.allMonitoringsAmountTitle;

        monitorings.forEach((item, i) => {
            message += `${++i}. ${item}\n`;
        });

        return ctx.replyWithHTML(message);
    } else {
        return ctx.reply(messages.noActiveMonitorings);
    }
}

async function sendToAdmin(message) {
    await bot.telegram.sendMessage(process.env.DEV_ID, message);
}

process.on('unhandledRejection', (e) => {
    console.log(e);
    sendToAdmin(`Unhandled Rejection! ${e.message}`);
});
  
process.on('uncaughtException', (e) => {
    console.log(e);
    sendToAdmin(`Uncaught Exception! ${e.message}`);
});