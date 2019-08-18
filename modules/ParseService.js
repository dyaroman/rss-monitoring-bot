const Parser = require('rss-parser');
const parser = new Parser();


const ParseService = {
    result: [],
    queriesArray: [
        // todo get from user.monitorings
    ],
    sourcesArray: [
        'http://feed.rutracker.cc/atom/f/4.atom', // Мультфильмы
        'http://feed.rutracker.cc/atom/f/7.atom', // Зарубежные сериалы
        'http://feed.rutracker.cc/atom/f/33.atom', // Аниме
        'http://feed.rutracker.cc/atom/f/189.atom', // Зарубежное кино
        'http://feed.rutracker.cc/atom/f/2366.atom', // Зарубежные сериалы (HD Video)
    ],
    search: async () => {
      for (const source of sourcesArray) {
          await readFeed(source);
      }
    },
    readFeed: async (source) => {
      const feed = await parser.parseURL(source);
    
      feed.items.forEach(item => {
          queriesArray.forEach(query => {
              if (item.title.toLowerCase().includes(query)) {
                  result.push({
                      title: item.title,
                      link: item.link
                  });
              }
          });
      });
    },
};


module.exports = ParseService;