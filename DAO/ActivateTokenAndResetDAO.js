(function ()
{
    'use strict';
    var mongoConverter = require('./mongoConverter'),
            UserModel = require('./UserDAO').model,
            applicationException = require('../services/applicationException'),
            getDate = require('../services/dateHelper').get,
            shortid = require('shortid'),
            MD5 = require('MD5'),
            mongoose = require('mongoose-q')(),
            resetPassword = new mongoose.Schema({
                token: {type: String, required: true},
                userId: {required: true, type: String, unique: true},
                expire: {required: true, type: Number}
            }, {
                collection: 'resetPassword'
            });
    var Model = mongoose.model('resetPassword', resetPassword);

    var offset = 3600000;//1h
    function create(userId)
    {
        return Model.findOneQ({userId: userId}).then(function (results)
        {
            if (!results) {
                return new Model({userId: userId, expire: getDate() + offset, token: MD5('' + getDate() + shortid())}).saveQ().then(function (newToken)
                {
                    return mongoConverter.fromMongo(newToken).token;
                })
            } else if (results && getDate() >= results.expire) {
                return Model.findByIdAndUpdateQ(results.id, {$set: {expire: getDate() + offset}}).then(function (updateToken)
                {
                    return mongoConverter.fromMongo(updateToken).token;
                });
            } else {
                throw applicationException.new(applicationException.PRECONDITION_FAILED, 'Email was sent, please check e-mail or try later.');
            }
        });
    }

    function remove(token)
    {
        return Model.findOneAndRemoveQ({token: token}).then(function (results)
        {
            if (!results) {
                throw applicationException.new(applicationException.CONFLICT);
            }
            results = mongoConverter.fromMongo(results);
            if (getDate() + 10800000 < results.expire) {
                return UserModel.removeQ({_id: results.userId, active: false}).then(function ()
                {
                    throw applicationException.new(applicationException.UNAUTHORIZED, 'Token has been expired')
                });

            }
            return results.userId;
        });
    }

    function checkToken(token)
    {
        return Model.findOneQ({token: token}).then(function (results)
        {
            if (!results) {
                throw applicationException.new(applicationException.UNAUTHORIZED, 'Token doesn\'t exist')
            }
            results = mongoConverter.fromMongo(results);
            if (getDate() + 10800000 < results.expire) {
                return Model.removeQ({token: token}).then(function ()
                {

                    throw applicationException.new(applicationException.UNAUTHORIZED, 'Token has been expired')
                });

            }
        });
    }

    module.exports = {
        checkToken: checkToken,
        remove: remove,
        create: create,
        model: Model
    }
})();
