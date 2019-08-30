require('dotenv').config();
const Telegraf = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

const RssService = require('./RssService');

class Monitoring {
  constructor(db) {
    this.db = db;
    this.timerInterval = 60 * 1000;//1 min
    this.timeToCheck = [9, 0];// 9:00AM

    this.init();
  }

  init() {
    this.timer = setInterval(() => {
      const now = new Date();

      if (now.getHours() === this.timeToCheck[0] && now.getMinutes() === this.timeToCheck[1]) {
        this.getUsers().then(users => {
          users.forEach(user => this.runSearch(user));
        });
      }
    }, this.timerInterval);
  }


  getUsers() {
    return this.db.collection('users').find({}).toArray();
  }

  runSearch(user) {
    if (!user.monitorings.length) {
      return; //no active monitorings
    }

    new RssService(user.monitorings)
      .search()
      .then(queryResults => this.sendSearchResults(user._id, queryResults));
  }

  sendSearchResults(userID, resultsArray) {
    const messagesArray = [];

    resultsArray.forEach(result => {
      let message = '';

      if (result.results.length) {
        message += `I found ${result.results.length} results for your request "<b>${result.query}</b>":\n\n`;

        result.results.forEach(item => {
          if (message.length <= 4096) {
            message += `<a href="${item.link}">${item.title}</a>\n\n`;
          } else {
            messagesArray.push(message);
            message = '';
          }
        });

        messagesArray.push(message);
      }
    });

    messagesArray.length && messagesArray.forEach(message => {
      bot.telegram.sendMessage(userID, message, {
        disable_web_page_preview: true,
        disable_notification: true,
        parse_mode: 'html'
      });
    });
  }
}


module.exports = Monitoring;