require('dotenv').config();
const Telegraf = require('telegraf');
const Scene = require('telegraf/scenes/base');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const Markup = require('telegraf/markup');

const messages = require('./src/data/messages');
const commands = require('./src/data/commands');
const MonitoringService = require('./src/services/monitoring.service');
const LogService = require('./src/services/log.service');
const UserModel = require('./src/models/user.model');


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
        require('./src/misc/db')();
        this.afterDbConnect();
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
        this.bot.start(async (ctx) => {
            const USER_ID = ctx.from.id;
            const isUserExisted = await UserModel.findOne({ id: USER_ID });

            if (!isUserExisted) {
                const newUser = new UserModel({
                    id: USER_ID
                });

                await newUser.save();
            }

            this.logService.start(ctx);

            return ctx.reply(messages.start);
        });
    }

    addCommand() {
        this.bot.command(commands.addNewMonitoring, async (ctx) => {
            const args = ctx.message.text
                .trim()
                .split(' ')
                .slice(1);

            if (args.length) {
                await this.addNewMonitoring(ctx, args.join(' '));
            } else {
                await ctx.reply(messages.addNewMonitoringQuestion);
                ctx.scene.enter(commands.addNewMonitoringScene);
            }
        });

        this.addNewMonitoringScene.on('text', async (ctx) => {
            await this.addNewMonitoring(ctx, ctx.message.text);

            await ctx.scene.leave();
        });
    }

    async addNewMonitoring(ctx, query) {
        query = query.trim();
        const USER_ID = ctx.from.id;
        const currentUser = await UserModel.findOne({ id: USER_ID });
        const monitorings = currentUser.monitorings;

        this.logService.log(USER_ID, {
            action: 'add',
            monitoring: query
        });

        if (monitorings.map((item) => item.toLowerCase()).includes(query.toLowerCase())) {
            ctx.reply(messages.existedMonitoring.replace('{{query}}', query));
        } else {
            monitorings.push(query);

            ctx.reply(messages.addedNewMonitoring.replace('{{query}}', query));
        }
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
            const errorMessage = `Unhandled Rejection at: promise, reason: ${reason}`;
            console.error(errorMessage);
            console.error(promise);
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
                    .replace('{{userInfo}}',
                        `id: ${ctx.from.id}, \nusername: ${ctx.from.username}, \nfirstName: ${ctx.from.first_name}, \nlastName: ${ctx.from.last_name}`)
                    .replace('{{errorMessage}}', e.message)
            );
        });
    }

    async sendToAdmin(message) {
        await this.bot.telegram.sendMessage(process.env.DEV_ID, message);
    }

    async send(userID, resultsArray) {
        const messagesArray = [];

        for (const prop in resultsArray) {
            let message = '';

            message += messages.searchResultTitle
                .replace('{{query}}', prop);

            resultsArray[prop].forEach((item, i) => {
                const link = `${++i}. <a href="${item.url}">${item.title}</a>\n\n`;
                if (message.length < 4096) {
                    message += link;
                } else {
                    messagesArray.push(message);
                    message = link;
                }
            });

            messagesArray.push(message);
        }

        for (const message of messagesArray) {
            await this.bot.telegram.sendMessage(userID, message, {
                disable_web_page_preview: true,
                disable_notification: true,
                parse_mode: 'html',
            });
        }
    }
}

const app = new App();


module.exports = app;