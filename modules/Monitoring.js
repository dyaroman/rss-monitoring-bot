require('dotenv').config();
const Telegraf = require('telegraf');
// const Telegram = require('telegraf/telegram');
const bot = new Telegraf(process.env.BOT_TOKEN);

const messages = require('./Messages');
const ParseService = require('./ParseService');

class Monitoring {
  constructor(db) {
    this.db = db;
    this.timerInterval = 50 * 60 * 1000;
    this.timeToCheck = 20;

    this.init();
  }

  init() {
    this.timer = setInterval(() => {
      if ((new Date()).getHours() === this.timeToCheck) {
        this.getUsers().then(users => {
          users.forEach(user => this.runSearch(user._id));
        });
      }
    }, this.timerInterval);
  }


  getUsers() {
    return this.db.collection('users').find({}).toArray();
  }

  runSearch(userID) {
    this.db.collection('users').findOne({ _id: userID }).then(user => {
      const monitorings = user.monitorings;

      if (!monitorings.length) {
        return bot.telegram.sendMessage(userID, messages.noActiveMonitorings);
      }

      new ParseService(userID, this.db)
        .search()
        .then(queryResults => this.sendSearchResults(userID, queryResults));
    });
  }

  sendSearchResults(userID, resultsArray) {
    const messagesArray = [];

    resultsArray.forEach(result => {
      let message = `<b>${result.query}:</b>\n\n`;

      if (result.results.length === 0) {
        message += `${messages.noSearchResult}\n`;
      }

      result.results.forEach(item => {
        if (message.length <= 4096) {
          message += `<a href="${item.link}">${item.title}</a>\n\n`;
        } else {
          messagesArray.push(message);
          message = '';
        }
      });

      messagesArray.push(message);
    });

    messagesArray.forEach(message => {
      bot.telegram.sendMessage(userID, message, {
        disable_web_page_preview: true,
        disable_notification: true,
        parse_mode: 'html'
      });
    });
  }

}


module.exports = Monitoring;