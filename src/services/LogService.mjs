import { app } from '../app';

export class LogService {
    constructor() { }

    start(ctx) {
        app.db.collection('logs').updateOne(
            { _id: ctx.from.id },
            {
                $setOnInsert: {
                    username: ctx.from.username,
                    firstName: ctx.from.first_name,
                    lastName: ctx.from.last_name,
                    history: [
                        {
                            action: 'start',
                            time: this.time,
                        },
                    ],
                },
            },
            { upsert: true },
        );
    }

    log(userId, obj) {
        app.db.collection('logs').updateOne(
            { _id: userId },
            {
                $push: {
                    history: Object.assign(obj, {
                        time: this.time,
                    }),
                },
            }
        );
    }

    get time() {
        return new Date().toString();
    }
}
