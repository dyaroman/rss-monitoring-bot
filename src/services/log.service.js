const LogModel = require('../models/log.model');


class LogService {
    async start(ctx) {
        const {
            id = null,
            username = null,
            first_name: firstName = null,
            last_name: lastName = null
        } = ctx.from;

        const userLog = await LogModel.findOne({id});

        if (userLog) {
            userLog['history'].push({
                action: 'start'
            });
            await userLog.save();
        } else {
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
        const userLog = await LogModel.findOne({id: userId});

        userLog['history'].push(obj);

        await userLog.save();
    }
}


module.exports = LogService;
