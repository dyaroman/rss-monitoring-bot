require('dotenv').config();
const Telegraf = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

const messages = require('./Messages');
const ParseService = require('./ParseService');

class Monitoring {
  constructor(db) {
    this.db = db;
    this.timerInterval = 60 * 60 * 1000;//1 hour
    this.timeToCheck = 9;// 9AM

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
        return; //no active monitorings
      }

      new ParseService(userID, monitorings)
        .search()
        .then(queryResults => this.sendSearchResults(userID, queryResults));
    });
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