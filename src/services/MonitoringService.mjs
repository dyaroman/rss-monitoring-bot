import { rssMonitoringBot } from '../app';
import { RssService } from './RssService';
import { ResultsOfSearch } from './ResultsOfSearch';

const resultsOfSearch = new ResultsOfSearch();

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
        return await rssMonitoringBot.db
            .collection('users')
            .find({})
            .toArray();
    }

    async runSearch(user) {
        const queryResults = await new RssService().search(user.monitorings);

        rssMonitoringBot.logService.log(user._id, {
            action: 'monitoring',
            results: queryResults,
        });

        resultsOfSearch.send(user._id, queryResults);
    }
}
