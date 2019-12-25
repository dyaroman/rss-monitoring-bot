class LogService {
    constructor() {
    }

    init(db) {
        this.db = db;
    }

    start(ctx) {
        this.db.collection('logs').updateOne(
            {_id: ctx.from.id},
            {
                $setOnInsert: {
                    username: ctx.from.username,
                    firstName: ctx.from.first_name,
                    lastName: ctx.from.last_name,
                    history: [
                        {
                            action: 'start',
                            time: new Date().toUTCString(),
                        },
                    ],
                },
            },
            {upsert: true},
        );
    }

    log(userId, obj) {
        this.db.collection('logs').updateOne({_id: userId}, {
            $push: {
                history: Object.assign(obj, {
                    time: new Date().toUTCString(),
                }),
            },
        });
    }
}

module.exports = LogService;
