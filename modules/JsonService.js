const fs = require('fs');

class JsonService {
  constructor(dirName) {
    this.dir = dirName;
    this.createDir();
  }

  createDir() {
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir);
    }
  }

  getFilePath(fileName) {
    return `./${this.dir}/${fileName}.json`;
  }

  writeJsonFile(fileName, data) {
    const json = JSON.stringify(data);

    if (typeof data !== 'object') {
      console.error('data should be object');
      return;
    }

    fs.writeFileSync(this.getFilePath(fileName), json, function (err) {
      if (err) {
        return console.log(err);
      }
    });
  }

  readJsonFile(fileName) {
    const json = fs.readFileSync(this.getFilePath(fileName), {
      encoding: 'utf-8'
    });
    return JSON.parse(json);
  }
}

module.exports = JsonService;