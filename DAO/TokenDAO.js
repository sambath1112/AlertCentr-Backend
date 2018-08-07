(function ()
{
    'use strict';
    var mongoConverter = require('./mongoConverter'),
            MD5 = require('MD5'),
            getDate = require('./../services/dateHelper').get,
            applicationException = require('../services/applicationException'),
            mongoose = require('mongoose-q')(),
            token = new mongoose.Schema({
                userId: {type: String, required: true},
                token: {required: true, type: String}
            }, {
                collection: 'token'
            });
    var Model = mongoose.model('token', token);

    function getRandomInt(min, max)
    {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function create(userId)
    {
        return new Model({userId: userId, token: MD5(getDate() + getRandomInt(100, 1000))}).saveQ().then(function (token)
        {
            return mongoConverter.fromMongo(token);
        });
    }


    function getByToken(token)
    {
        return Model.findOneQ({token: token}).then(function (results)
        {
            if (!results) {
                throw  applicationException.new(applicationException.UNAUTHORIZED, 'Your session has expired');
            }
            return mongoConverter.fromMongo(results);
        });
    }


    function removeByToken()
    {
    }

    module.exports = {
        create: create,
        getByToken: getByToken,
        removeByToken: removeByToken,
        model: Model,
        schema: token
    }
})();
