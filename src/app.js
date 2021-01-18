require("dotenv").config();
const Telegraf = require("telegraf");
const Scene = require("telegraf/scenes/base");
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const Markup = require("telegraf/markup");
const EventEmitter = require("events");
global.appMediator = {};
global.appMediator.MonitoringService = new EventEmitter();

const messages = require("./data/messages");
const commands = require("./data/commands");
const MonitoringService = require("./services/monitoring.service");
const LogService = require("./services/log.service");
const UserModel = require("./models/user.model");

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

        global.appMediator.MonitoringService.on(
            "readyToSend",
            async (object) => {
                await this.send(object.id, object.data);
            }
        );
    }

    connectToDb() {
        require("./misc/db");
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
                    id: USER_ID,
                });

                await newUser.save();
            }

            await this.logService.start(ctx);

            return ctx.reply(messages.start);
        });
    }

    addCommand() {
        this.bot.command(commands.addNewMonitoring, async (ctx) => {
            const args = ctx.message.text.trim().split(" ").slice(1);

            if (args.length) {
                await this.addNewMonitoring(ctx, args.join(" "));
            } else {
                await ctx.reply(messages.addNewMonitoringQuestion);
                ctx.scene.enter(commands.addNewMonitoringScene);
            }
        });

        this.addNewMonitoringScene.on("text", async (ctx) => {
            await this.addNewMonitoring(ctx, ctx.message.text);

            await ctx.scene.leave();
        });
    }

    async addNewMonitoring(ctx, query) {
        query = query.trim();
        const USER_ID = ctx.from.id;
        const currentUser = await UserModel.findOne({ id: USER_ID });
        const { monitorings } = currentUser;

        await this.logService.log(USER_ID, {
            action: "add",
            monitoring: query,
        });

        if (
            monitorings
                .map((item) => item.toLowerCase())
                .includes(query.toLowerCase())
        ) {
            ctx.reply(messages.existedMonitoring.replace("{{query}}", query));
        } else {
            monitorings.push(query);
            await currentUser.save();
            ctx.reply(messages.addedNewMonitoring.replace("{{query}}", query));
        }
    }

    removeCommand() {
        this.bot.command(commands.removeMonitoring, async (ctx) => {
            const args = ctx.message.text.trim().split(" ").slice(1);

            if (args.length) {
                await this.removeMonitoring(ctx, args.join(" "));
            } else {
                await ctx.reply(messages.removeMonitoringQuestion);
                ctx.scene.enter(commands.removeMonitoringScene);
            }
        });

        this.removeMonitoringScene.on("text", async (ctx) => {
            await this.removeMonitoring(ctx, ctx.message.text);

            await ctx.scene.leave();
        });
    }

    async removeMonitoring(ctx, query) {
        query = query.trim();
        let monitoringToRemove = query;
        const USER_ID = ctx.from.id;
        const currentUser = await UserModel.findOne({ id: USER_ID });
        const { monitorings } = currentUser;
        const arrayFromQuery = query.trim().split(" ");
        const monitoringListNumber = parseInt(arrayFromQuery[0], 10);

        if (arrayFromQuery.length === 1 && monitoringListNumber) {
            monitoringToRemove = monitorings[monitoringListNumber - 1]
                ? monitorings[monitoringListNumber - 1]
                : query;
        }

        await this.logService.log(USER_ID, {
            action: "remove",
            monitoring: monitoringToRemove,
        });

        if (
            monitorings
                .map((item) => item.toLowerCase())
                .includes(monitoringToRemove.toLowerCase())
        ) {
            const index = monitorings.findIndex(
                (item) =>
                    item.toLowerCase() === monitoringToRemove.toLowerCase()
            );
            if (index > -1) {
                monitorings.splice(index, 1);
            }
            await currentUser.save();

            ctx.reply(
                messages.removedMonitoring.replace(
                    "{{query}}",
                    monitoringToRemove
                )
            );
        } else {
            ctx.reply(
                messages.monitoringNotFound.replace(
                    "{{query}}",
                    monitoringToRemove
                )
            );
        }
    }

    removeAllCommand() {
        this.bot.command(commands.removeAllMonitorings, (ctx) => {
            this.confirmRemoveAllMonitorings(ctx);
        });

        this.bot.action(commands.removeAllMonitoringsConfirmed, async (ctx) => {
            await ctx.answerCbQuery();
            await this.removeAllMonitorings(ctx);
        });
    }

    confirmRemoveAllMonitorings(ctx) {
        ctx.reply(
            messages.confirmRemoveAllMonitorings,
            Markup.inlineKeyboard([
                [
                    Markup.callbackButton(
                        messages.confirmRemoveAllMonitoringButton,
                        commands.removeAllMonitoringsConfirmed
                    ),
                ],
            ])
                .oneTime()
                .resize()
                .extra()
        );
    }

    async removeAllMonitorings(ctx) {
        const USER_ID = ctx.from.id;
        const currentUser = await UserModel.findOne({ id: USER_ID });
        const { monitorings } = currentUser;

        await this.logService.log(USER_ID, {
            action: "remove_all",
        });

        if (monitorings.length) {
            await UserModel.updateOne(
                { id: USER_ID },
                { $pullAll: { monitorings } }
            );

            return ctx.reply(messages.allMonitoringsRemoved);
        } else {
            return ctx.reply(messages.noActiveMonitorings);
        }
    }

    showCommand() {
        this.bot.command(commands.showMonitorings, async (ctx) => {
            await this.showMonitorings(ctx);
        });
    }

    async showMonitorings(ctx) {
        const USER_ID = ctx.from.id;
        const currentUser = await UserModel.findOne({ id: USER_ID });
        const { monitorings } = currentUser;

        await this.logService.log(USER_ID, {
            action: "show",
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

    errorsHandler() {
        process.on("unhandledRejection", async (reason, promise) => {
            const errorMessage = `Unhandled Rejection at: promise, reason: ${reason}`;
            console.error(errorMessage);
            console.error(promise);
            await this.sendToAdmin(errorMessage);
        });

        process.on("uncaughtException", async (error) => {
            console.error(
                `${new Date().toUTCString()} uncaughtException: ${
                    error.message
                }`
            );
            console.error(error.stack);
            await this.sendToAdmin(
                `Uncaught Exception! ${new Date().toUTCString()}, ${error}`
            );
            process.exit(1);
        });

        this.bot.catch(async (error, ctx) => {
            console.error(error);
            await this.sendToAdmin(
                messages.errorNotification
                    .replace(
                        "{{userInfo}}",
                        `id: ${ctx.from.id}, \nusername: ${ctx.from.username}, \nfirstName: ${ctx.from.first_name}, \nlastName: ${ctx.from.last_name}`
                    )
                    .replace("{{errorMessage}}", error.message)
            );
        });
    }

    async sendToAdmin(message) {
        await this.bot.telegram.sendMessage(process.env.DEV_ID, message);
    }

    async send(userID, results) {
        const messagesArray = [];

        for (const result of results) {
            let messageString = "";

            messageString += messages.searchResultTitle.replace(
                "{{query}}",
                result.monitoring
            );

            result.results.forEach((item, i) => {
                const link = `${++i}. <a href="${item.url}">${
                    item.title
                }</a>\n\n`;
                if (messageString.length < 4096) {
                    messageString += link;
                } else {
                    messagesArray.push(messageString);
                    messageString = link;
                }
            });

            messagesArray.push(messageString);
        }

        for (const message of messagesArray) {
            await this.bot.telegram.sendMessage(userID, message, {
                disable_web_page_preview: true,
                disable_notification: true,
                parse_mode: "html",
            });
        }
    }
}

new App();
