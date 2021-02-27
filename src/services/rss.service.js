const Parser = require("rss-parser");

const searchSources = require("../misc/search-sources");
const { searchInData } = require("./functions");

class RssService {
    constructor() {
        this.parser = new Parser();
        this.sources = searchSources;
        this.tempArray = [];
        this.tempObject = {};
        this.result = [];
    }

    async search(monitorings) {
        const startTime = new Date();

        this.monitorings = monitorings;

        await this.getDataFromRss();

        this.prepareResult();

        return {
            result: this.result,
            perfomance: new Date() - startTime + " ms",
        };
    }

    async getDataFromRss() {
        for (const source of this.sources) {
            const feed = await this.parser.parseURL(source);

            for (const feedItem of feed.items) {
                if (!this.isYesterday(new Date(feedItem.pubDate))) {
                    continue;
                }

                for (const monitoring of this.monitorings) {
                    if (searchInData(monitoring, feedItem.title)) {
                        this.tempArray.push({
                            monitoring,
                            title: feedItem.title,
                            url: feedItem.link,
                        });
                    }
                }
            }
        }
    }

    prepareResult() {
        for (const item of this.tempArray) {
            if (this.tempObject.hasOwnProperty(item.monitoring)) {
                continue;
            } else {
                this.tempObject[item.monitoring] = [];
            }
        }

        for (const item of this.tempArray) {
            this.tempObject[item.monitoring].push({
                title: item.title,
                url: item.url,
            });
        }

        for (const prop in this.tempObject) {
            if (this.tempObject.hasOwnProperty(prop)) {
                this.result.push({
                    monitoring: prop,
                    results: this.tempObject[prop],
                });
            }
        }
    }

    isYesterday(date) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        return (
            date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear()
        );
    }
}

module.exports = RssService;
