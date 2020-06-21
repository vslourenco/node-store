const mongodb = require('mongodb');

const { MongoClient } = mongodb;

let _db;

const mongoConnect = (callback) => {
  MongoClient.connect('mongodb+srv://omnistack:omnistack@development-h5m1r.mongodb.net/nodestore?retryWrites=true&w=majority')
    .then((client) => {
      console.log('Connected!');
      _db = client.db();
      callback();
    })
    .catch((err) => {
      console.log(err);
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  // eslint-disable-next-line no-throw-literal
  throw 'No database found!';
};

module.exports.mongoConnect = mongoConnect;
module.exports.getDb = getDb;
