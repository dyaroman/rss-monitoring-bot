import Parser from 'rss-parser';
const parser = new Parser();

export class RssService {
    constructor() {
        this.searchResults = [];
        this.sourcesArray = [
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

        return this.searchResults;
    }

    async searchInFeed(monitoring) {
        const arr = [];
        for (const source of this.sourcesArray) {
            await parser.parseURL(source).then((feed) => {
                feed.items
                    .filter((item) => this.isYesterday(new Date(item.pubDate)))
                    .forEach((item) => {
                        const itemTitle = item.title.trim().toLowerCase();

                        const queryArray = monitoring
                            .trim()
                            .replace(/  +/gm, ' ')
                            .toLowerCase()
                            .split(' ');

                        if (queryArray.every((query) => itemTitle.includes(query))) {
                            arr.push({
                                title: item.title,
                                link: item.link,
                            });
                        }
                    });
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
