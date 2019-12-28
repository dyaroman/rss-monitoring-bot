import Parser from 'rss-parser';

export class RssService {
    constructor() {
        this.parser = new Parser();
        this.searchResults = [];
        this.sources = [
            'http://feed.rutracker.cc/atom/f/2343.atom', // Отечественные мультфильмы (HD Video)
            'http://feed.rutracker.cc/atom/f/930.atom', // Иностранные мультфильмы (HD Video)
            'http://feed.rutracker.cc/atom/f/2365.atom', // Иностранные короткометражные мультфильмы (HD Video)
            'http://feed.rutracker.cc/atom/f/208.atom', // Отечественные мультфильмы
            'http://feed.rutracker.cc/atom/f/539.atom', // Отечественные полнометражные мультфильмы
            'http://feed.rutracker.cc/atom/f/209.atom', // Иностранные мультфильмы
            'http://feed.rutracker.cc/atom/f/484.atom', // Иностранные короткометражные мультфильмы
            'http://feed.rutracker.cc/atom/f/1460.atom', // Мультсериалы (HD Video)
            'http://feed.rutracker.cc/atom/f/7.atom', // Зарубежное кино
            'http://feed.rutracker.cc/atom/f/1950.atom', // Фильмы 2019
            'http://feed.rutracker.cc/atom/f/33.atom', // Аниме
            'http://feed.rutracker.cc/atom/f/189.atom', // Зарубежные сериалы
            'http://feed.rutracker.cc/atom/f/313.atom', // Зарубежное кино (HD Video)
            'http://feed.rutracker.cc/atom/f/2198.atom', // HD Video
            'http://feed.rutracker.cc/atom/f/2366.atom', // Зарубежные сериалы (HD Video)
            'http://feed.rutracker.cc/atom/f/124.atom', // Арт-хаус и авторское кино
        ];
    }

    async search(monitorings) {
        for (const monitoring of monitorings) {
            const resultsFromFeed = await this.searchInFeed(monitoring);

            if (resultsFromFeed.length) {
                this.searchResults.push({
                    query: monitoring,
                    results: resultsFromFeed,
                });
            }
        }

        // for (const source of this.sources) {
        //     const feed = await this.parser.parseURL(source);
        //     const feedItems = feed.items;

        //     for (let f = 0; f < feedItems.length; f++) {
        //         if (!this.isYesterday(new Date(feedItems[f].pubDate))) {
        //             continue;
        //         }

        //         const feedItemTitle = feedItems[f].title.trim().toLowerCase();

        //         for (let m = 0; m < this.monitorings.length; m++) {
        //             const keywords = this.monitorings[m]
        //                 .trim()
        //                 .replace(/  +/gm, ' ')
        //                 .toLowerCase()
        //                 .split(' ');

        //             if (
        //                 keywords.every(
        //                     (keyword) => feedItemTitle.includes(keyword)
        //                 )
        //             ) {
        //                 this.searchResults.push({
        //                     monitoring: this.monitorings[m],
        //                     title: feedItems[f].title,
        //                     url: feedItems[f].link,
        //                 });
        //             }
        //         }
        //     }
        // }

        return this.searchResults;
    }

    async searchInFeed(monitoring) {
        const arr = [];
        for (const source of this.sources) {
            const feed = await this.parser.parseURL(source);

            feed.items
                .filter((item) => this.isYesterday(new Date(item.pubDate)))
                .forEach((item) => {
                    const feedItemTitle = item.title.trim().toLowerCase();

                    const keywords = monitoring
                        .trim()
                        .replace(/  +/gm, ' ')
                        .toLowerCase()
                        .split(' ');

                    if (keywords.every((keyword) => feedItemTitle.includes(keyword))) {
                        arr.push({
                            title: item.title,
                            link: item.link,
                        });
                    }
                });
        }
        return arr;
    }

    isYesterday(date) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        return date.getDate() === yesterday.getDate()
            && date.getMonth() === yesterday.getMonth()
            && date.getFullYear() === yesterday.getFullYear();
    }
}
