import dotenv from 'dotenv';
import Telegraf from 'telegraf';

import {RssService} from './RssService';
import {ResultsOfSearch} from './ResultsOfSearch';

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);
const resultsOfSearch = new ResultsOfSearch(bot);

export class MonitoringService {
    constructor(db, logService) {
        this.db = db;
        this.logService = logService;

        this.timerInterval = 60 * 1000; //1 min
        this.timeToCheck = [7, 0]; // 7:00AM (kiev)

        this.init();
    }

    init() {
        setInterval(() => {
            const now = new Date();

            if (now.getHours() === this.timeToCheck[0] && now.getMinutes() === this.timeToCheck[1]) {
                this.getUsers().then((users) => {
                    users.forEach((user) => {
                        if (user.monitorings.length) {
                            this.runSearch(user);
                        }
                    });
                });
            }
        }, this.timerInterval);
    }

    getUsers() {
        return this.db
            .collection('users')
            .find({})
            .toArray();
    }

    runSearch(user) {
        new RssService(user.monitorings)
            .search()
            .then((queryResults) => {
                this.logService.log(user._id, {
                    action: 'monitoring',
                    results: queryResults,
                });
                resultsOfSearch.send(user._id, queryResults);
            });
    }
}
