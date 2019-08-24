const Telegraf = require('telegraf');
const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const Markup = require('telegraf/markup');
const mongo = require('mongodb').MongoClient;
require('dotenv').config();


const messages = require('./modules/Messages');
const commands = require('./modules/Commands');
const ParseService = require('./modules/ParseService');
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
        //todo send error to me in telegram
        console.log(err);
    }

    db = client.db('rss_monitoring_bot');
    bot.startPolling();
});

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

const addNewMonitoring = async (ctx, query) => {
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').find({ _id: USER_ID }).toArray();
    const monitorings = currentUser[0].monitorings;

    ctx.session.newMonitoring = query;

    db.collection('logs').updateOne(
        { _id: USER_ID },
        { $push: { history: ctx.session.newMonitoring } }
    );

    if (!monitorings.map(item => item.toLowerCase()).includes(ctx.session.newMonitoring.toLowerCase())) {
        db.collection('users').updateOne(
            { _id: USER_ID },
            { $push: { monitorings: ctx.session.newMonitoring } }
        );

        ctx.reply(`✅ "${ctx.session.newMonitoring}" ${messages.addedNewMonitoring}`);
    } else {
        ctx.reply(`❎ "${ctx.session.newMonitoring}" ${messages.existedMonitoring}`);
    }
};

const removeMonitoring = async (ctx, query) => {
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').find({ _id: USER_ID }).toArray();
    const monitorings = currentUser[0].monitorings;

    ctx.session.monitoringToRemove = query;

    if (monitorings.includes(query)) {
        db.collection('users').updateOne(
            { _id: USER_ID },
            { $pull: { monitorings: ctx.session.monitoringToRemove } }
        );

        ctx.reply(`✅ "${ctx.session.monitoringToRemove}" ${messages.removedMonitoring}`);
    } else {
        ctx.reply(`❎ "${ctx.session.monitoringToRemove}" ${messages.monitoringNotFound}`);
    }
};

const removeAllMonitorings = async (ctx) => {
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').find({ _id: USER_ID }).toArray();
    const monitorings = currentUser[0].monitorings;

    if (monitorings.length) {
        db.collection('users').updateOne(
            { _id: USER_ID },
            { $set: { monitorings: [] } }
        );
    
        return ctx.reply(messages.allMonitoringsRemoved);
    } else {
        return ctx.reply(messages.noActiveMonitorings);
    }
};

const showMonitorings = async (ctx) => {
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').find({ _id: USER_ID }).toArray();
    const monitorings = currentUser[0].monitorings;

    if (monitorings.length) {
        let message = '<b>Your active monitorings:</b>\n\n';
        monitorings.forEach(item => {
            message += `${item}\n`;
        });
        return ctx.replyWithHTML(message);
    } else {
        return ctx.reply(messages.noActiveMonitorings);
    }
};

const runSearch = async (ctx) => {
    const USER_ID = ctx.from.id;
    const currentUser = await db.collection('users').find({ _id: USER_ID }).toArray();
    const monitorings = currentUser[0].monitorings;

    if (!monitorings.length) {
        return ctx.reply(messages.noActiveMonitorings);
    }

    const parseService = new ParseService(ctx.from.id, db);
    parseService
        .search()
        .then(queryResults => {
            const messagesArray = [];

            //todo save results to db
            queryResults.forEach(queryResult => {
                let message = `<b>${queryResult.query}:</b>\n\n`;

                if (queryResult.results.length === 0) {
                    message += `${messages.noSearchResult}\n`;
                }

                queryResult.results.forEach(item => {
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

    db.collection('users').updateOne(
        {
            _id: USER_ID
        },
        {
            $setOnInsert: {
                monitorings: []
            }
        },
        {
            upsert: true
        }
    );

    db.collection('logs').updateOne(
        {
            _id: USER_ID
        },
        {
            $setOnInsert: {
                username: ctx.from.username,
                fullName: `${ctx.from.first_name} ${ctx.from.last_name}`,
                history: [],
            }
        },
        {
            upsert: true
        }
    );

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

//todo move to the Commands.js
bot.command('remove_all', (ctx) => {
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
