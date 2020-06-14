const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-store', 'root', 'root', {
    dialect: 'mysql',
    host: 'localhost'
});

module.exports = sequelize;