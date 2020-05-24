const LogModel = require('../models/log.model');


class LogService {
    async start(ctx) {
        const {
            id,
            username,
            first_name: firstName,
            last_name: lastName
        } = ctx.from;

        const userLog = LogModel.findOne({ id });

        if (!userLog) {
            const newLog = new LogModel({
                id,
                firstName,
                lastName,
                username,
                history: [
                    {
                        action: 'start'
                    }
                ]
            });

            await newLog.save();
        }
    }

    async log(userId, obj) {
        const userLog = await LogModel.findOne({ id: userId });

        userLog.history.push(obj);

        await userLog.save();
    }

    get time() {
        return new Date().toString();
    }
}


module.exports = LogService;
