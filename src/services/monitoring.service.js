const RssService = require('./rss.service');
const LogService = require('./log.service');
const ResultModel = require('../models/result.model');
const UserModel = require('../models/user.model');

class MonitoringService {
    constructor() {
        this.timerInterval = 60 * 1000; //1 min
        this.timeToCheck = this.timeStringToArray('00:00'); //00:00AM (kiev)
        this.logService = new LogService();
        this.init();
    }

    init() {
        this.checkTime();
        setInterval(this.checkTime.bind(this), this.timerInterval);
    }

    async checkTime() {
        const now = new Date();

        if (
            now.getHours() === this.timeToCheck[0] &&
            now.getMinutes() === this.timeToCheck[1]
        ) {
            const users = await UserModel.find({});

            for (const user of users) {
                if (user.monitorings.length) {
                    await this.runSearch(user);
                }
            }
        }
    }

    async runSearch(user) {
        const {result, performance} = await new RssService().search(
            user.monitorings
        );

        const newResult = new ResultModel({
            id: user.id,
            monitorings: result,
            performance,
        });
        await newResult.save();

        await this.logService.log(user.id, {
            action: 'monitoring',
        });

        global.appMediator.MonitoringService.emit('readyToSend', {
            id: user.id,
            data: result,
        });
    }

    timeStringToArray(timeString) {
        return timeString.split(':').map(t => parseInt(t, 10));
    }
}

module.exports = MonitoringService;
