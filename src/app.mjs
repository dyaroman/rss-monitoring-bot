import Telegraf from 'telegraf';
import MongoClient from 'mongodb';
import dotenv from 'dotenv';
import Scene from 'telegraf/scenes/base';
import Stage from 'telegraf/stage';
import session from 'telegraf/session';
import Markup from 'telegraf/markup';

import { MonitoringService } from './services/MonitoringService';
import { LogService } from './services/LogService';
import { messages } from './data/messages';
import { commands } from './data/commands';

dotenv.config();

class App {
    constructor() {
        this.bot = new Telegraf(process.env.BOT_TOKEN);
        this.stage = new Stage();
        this.addNewMonitoringScene = new Scene(commands.addNewMonitoringScene);
        this.removeMonitoringScene = new Scene(commands.removeMonitoringScene);

        this.init();
        this.connectToDb();
    }

    init() {
        this.stage.register(this.addNewMonitoringScene);
        this.stage.register(this.removeMonitoringScene);

        this.bot.use(session());
        this.bot.use(this.stage.middleware());
    }

    connectToDb() {
        MongoClient.connect(
            process.env.MONGODB_URL,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            },
            async (err, client) => {
                if (err) {
                    await this.sendToAdmin(err);
                }

                this.db = client.db(process.env.DB_NAME);
                this.afterDbConnect();
            },
        );
    }

    afterDbConnect() {
        this.setHandlers();
        this.logService = new LogService();
        new MonitoringService();
        this.bot.startPolling();
    }

    setHandlers() {
        this.startCommand();
        this.addCommand();
        this.removeCommand();
        this.removeAllCommand();
        this.showCommand();
        this.errorsHandler();
    }

    startCommand() {
        this.bot.start((ctx) => {
            const USER_ID = ctx.from.id;

            this.db.collection('users').updateOne(
                { _id: USER_ID },
                {
                    $setOnInsert: {
                        monitorings: [],
                    },
                },
                { upsert: true },
            );

            this.logService.start(ctx);

            return ctx.reply(messages.start);
        });
    }

    addCommand() {
        const addNewMonitoring = async (ctx, query) => {
            query = query.trim();
            const USER_ID = ctx.from.id;
            const currentUser = await this.db.collection('users').findOne({ _id: USER_ID });
            const monitorings = currentUser.monitorings;

            this.logService.log(USER_ID, {
                action: 'add',
                monitoring: query,
            });

            if (monitorings.map((item) => item.toLowerCase()).includes(query.toLowerCase())) {
                ctx.reply(messages.existedMonitoring.replace('{{query}}', query));
            } else {
                this.db.collection('users').updateOne(
                    { _id: USER_ID },
                    {
                        $push: {
                            monitorings: query
                        }
                    }
                );

                ctx.reply(messages.addedNewMonitoring.replace('{{query}}', query));
            }
        }

        this.addNewMonitoringScene.on('text', async (ctx) => {
            await addNewMonitoring(ctx, ctx.message.text);

            await ctx.scene.leave();
        });

        this.bot.command(commands.addNewMonitoring, async (ctx) => {
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
    }

    removeCommand() {
        const removeMonitoring = async (ctx, query) => {
            query = query.trim();
            let monitoringToRemove = query;
            const USER_ID = ctx.from.id;
            const currentUser = await this.db.collection('users').findOne({ _id: USER_ID });
            const monitorings = currentUser.monitorings;
            const arrayFromQuery = query.trim().split(' ');
            const monitoringListNumber = parseInt(arrayFromQuery[0], 10);

            if (arrayFromQuery.length === 1 && monitoringListNumber) {
                monitoringToRemove = monitorings[monitoringListNumber - 1] ? monitorings[monitoringListNumber - 1] : query;
            }

            this.logService.log(USER_ID, {
                action: 'remove',
                monitoring: monitoringToRemove,
            });

            if (monitorings
                .map((item) => item.toLowerCase())
                .includes(monitoringToRemove.toLowerCase())
            ) {
                this.db.collection('users').updateOne(
                    { _id: USER_ID },
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

        this.removeMonitoringScene.on('text', async (ctx) => {
            await removeMonitoring(ctx, ctx.message.text);

            await ctx.scene.leave();
        });

        this.bot.command(commands.removeMonitoring, async (ctx) => {
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
    }

    removeAllCommand() {
        const confirmRemoveAllMonitorings = (ctx) => {
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

        const removeAllMonitorings = async (ctx) => {
            const USER_ID = ctx.from.id;
            const currentUser = await this.db.collection('users').findOne({ _id: USER_ID });
            const monitorings = currentUser.monitorings;

            this.logService.log(USER_ID, {
                action: 'remove_all',
            });

            if (monitorings.length) {
                await this.db.collection('users').updateOne(
                    { _id: USER_ID },
                    {
                        $set: {
                            monitorings: []
                        }
                    }
                );

                return ctx.reply(messages.allMonitoringsRemoved);
            } else {
                return ctx.reply(messages.noActiveMonitorings);
            }
        }

        this.bot.command(commands.removeAllMonitorings, (ctx) => {
            confirmRemoveAllMonitorings(ctx);
        });

        this.bot.action(commands.removeAllMonitoringsConfirmed, async (ctx) => {
            await ctx.answerCbQuery();
            await removeAllMonitorings(ctx);
        });
    }

    showCommand() {
        const showMonitorings = async (ctx) => {
            const USER_ID = ctx.from.id;
            const currentUser = await this.db.collection('users').findOne({ _id: USER_ID });
            const monitorings = currentUser.monitorings;

            this.logService.log(USER_ID, {
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

        this.bot.command(commands.showMonitorings, async (ctx) => {
            await showMonitorings(ctx);
        });
    }

    errorsHandler() {
        process.on('unhandledRejection', (reason, promise) => {
            const errorMessage = `Unhandled Rejection at: ${promise}, reason: ${reason}`;
            console.error(errorMessage);
            this.sendToAdmin(errorMessage);
        });

        process.on('uncaughtException', (error) => {
            this.sendToAdmin(`Uncaught Exception! ${(new Date).toUTCString()}, ${error}`);
            console.error(`${(new Date).toUTCString()} uncaughtException: ${error.message}`);
            console.error(err.stack);
            process.exit(1);
        });

        this.bot.catch((e, ctx) => {
            console.error(e);
            this.sendToAdmin(
                messages.errorNotification
                    .replace('{{userId}}', ctx.from.id)
                    .replace('{{errorMessage}}', e.message)
            );
        });
    }

    async sendToAdmin(message) {
        await this.bot.telegram.sendMessage(process.env.DEV_ID, message);
    }

    send(userID, resultsArray) {
        const messagesArray = [];

        for (const prop in resultsArray) {
            let message = '';

            message += messages.searchResultTitle
                .replace('{{query}}', prop);

            resultsArray[prop].forEach((item, i) => {
                if (message.length <= 4096) {
                    message += `${++i}. <a href="${item.url}">${item.title}</a>\n\n`;
                } else {
                    messagesArray.push(message);
                    message = '';
                }
            });

            messagesArray.push(message);
        }

        messagesArray.forEach(async (message) => {
            await app.bot.telegram.sendMessage(userID, message, {
                disable_web_page_preview: true,
                disable_notification: true,
                parse_mode: 'html',
            });
        });
    }
}

export const app = new App();
