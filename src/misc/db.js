const mongoose = require('mongoose');


module.exports = () => {
    mongoose.connect(
        process.env.DATABASE_URL,
        {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false
        });

    mongoose.connection.on('connected', () => {
        console.log('Mongoose default connection is open');
    });

    mongoose.connection.on('error', (error) => {
        console.log(`Mongoose default connection has occured "${error}" error`);
        process.exit(1);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('Mongoose default connection is disconnected');
    });

    process.on('SIGINT', () => {
        mongoose.connection.close(() => {
            console.log('Mongoose default connection is disconnected due to application termination');
            process.exit(0);
        });
    });
}
