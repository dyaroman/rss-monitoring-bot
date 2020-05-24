const app = require('../../app');
const Rss = require('./rss.service');


class Monitoring {
    constructor() {
        this.timerInterval = 60 * 1000; //1 min
        this.timeToCheck = this.timeStringToArray('00:00'); //00:00AM (kiev)

        this.init();
    }

    init() {
        setInterval(async () => {
            const now = new Date();

            if (now.getHours() === this.timeToCheck[0]
                && now.getMinutes() === this.timeToCheck[1]) {
                const users = await this.users();

                for (const user of users) {
                    if (user.monitorings.length) {
                        this.runSearch(user);
                    }
                }
            }
        }, this.timerInterval);
    }

    async users() {
        return await app.db
            .collection('users')
            .find({})
            .toArray();
    }

    async runSearch(user) {
        const queryResults = await new Rss().search(user.monitorings);

        app.logService.log(user._id, {
            action: 'monitoring',
            results: queryResults,
        });

        app.send(user._id, queryResults);
    }

    timeStringToArray(timeString) {
        return timeString.split(':').map(t => parseInt(t, 10));
    }
}


module.exports = Monitoring;
