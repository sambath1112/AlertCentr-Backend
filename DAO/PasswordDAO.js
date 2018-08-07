(function ()
{
    'use strict';
    var mongoConverter = require('./mongoConverter'),
            applicationException = require('../services/applicationException'),
            mongoose = require('mongoose-q')(),
            password = new mongoose.Schema({
                password: {type: String, required: true},
                userId: {required: true, type: String, unique: true}
            }, {
                collection: 'password'
            });
    var Model = mongoose.model('password', password);

    function createOrUpdate(userId, password)
    {
        return Model.findOneQ({userId: userId}).then(function (pass)
        {
            if (!pass) {
                return new Model({userId: userId, password: password}).saveQ().then(function (passFromDB)
                {
                    return mongoConverter.fromMongo(passFromDB);
                });
            } else {
                return Model.findOneAndUpdateQ({userId: userId}, {password: password}, {'new': true}).then(function (passFromDB)
                {
                    return mongoConverter.fromMongo(passFromDB);
                });
            }
        });
    }

    function getByUserId(userId)
    {
        return Model.findOneQ({userId: userId}).then(function (password)
        {
            if (!password) {
                throw applicationException.new(applicationException.NOT_FOUND, 'Password does not exist')
            }
            return mongoConverter.fromMongo(password);
        });
    }

    function authorize(userId, password)
    {
        return Model.findOneQ({userId: userId, password: password}).then(function (results)
        {
            if (!results) {
                throw applicationException.new(applicationException.UNAUTHORIZED, 'User and password do not match');
            }
        });
    }

    module.exports = {
        authorize: authorize,
        createOrUpdate: createOrUpdate,
        getByUserId: getByUserId,
        model: Model,
        schema:password
    }
})();
