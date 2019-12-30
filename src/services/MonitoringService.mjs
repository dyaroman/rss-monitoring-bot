import { app } from '../app';
import { RssService } from './RssService';

export class MonitoringService {
    constructor() {
        this.timerInterval = 60 * 1000; //1 min
        this.timeToCheck = [0, 1]; //00:01AM (kiev)

        this.init();
    }

    init() {
        setInterval(async () => {
            const now = new Date();

            if (now.getHours() === this.timeToCheck[0] && now.getMinutes() === this.timeToCheck[1]) {
                const users = await this.users();

                users.forEach((user) => {
                    if (user.monitorings.length) {
                        this.runSearch(user);
                    }
                });
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
        const queryResults = await new RssService().search(user.monitorings);

        app.logService.log(user._id, {
            action: 'monitoring',
            results: queryResults,
        });

        app.send(user._id, queryResults);
    }
}
