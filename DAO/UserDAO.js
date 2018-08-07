(function ()
{
    'use strict';

    var mongoConverter = require('./mongoConverter'),
            _ = require('lodash'),
            Promise = require('bluebird'),
            applicationException = require('../services/applicationException'),
            AlertModel = require('./AlertDAO').model,
            mongoose = require('mongoose-q')(),
            users = new mongoose.Schema({
                firstName: String,
                lastName: String,
                email: {type: String, required: true, unique: true},
                phoneNumber: Number,
                companyName: String,
                login: String,
                timezone: String,
                reportsEmail: String,
                alertEmail: String,
                alertId: String,
                detected: {type: Boolean, default: false},
                admin: {type: Boolean, default: false},
                active: {type: Boolean, default: false},
                lastReport: Number
            }, {
                collection: 'users'
            });
    var Model = mongoose.model('users', users);

    function getUserByEmail(email)
    {
        return Model.findOneQ({email: email}).then(function (user)
        {
            if (!user) {
                throw new applicationException.new(applicationException.NOT_FOUND, 'User not exist.');
            }
            return mongoConverter.fromMongo(user);
        });
    }

    function getActiveUserByEmail(email)
    {
        return Model.findOneQ({email: email, active: true}).then(function (user)
        {
            if (!user) {
                throw new applicationException.new(applicationException.UNAUTHORIZED, 'User doesn\'t exist or not active account');
            }
            return mongoConverter.fromMongo(user);
        });
    }

    function saveSettings(user)
    {
        var update = {};
        for (var key in user) {
            if (user.hasOwnProperty(key)) {
                update[key] = user[key]
            }
        }
        return Model.findByIdAndUpdate(user.id, update,
                {'new': true}).then(function (user)
                {
                    return {results: mongoConverter.fromMongo(user)};
                });
    }

    function getUserById(userId)
    {
        return Model.findOneQ({_id: userId, active: true}).then(function (user)
        {
            if (!user) {
                throw applicationException.new(applicationException.UNAUTHORIZED, 'User does not exist')
            }
            return mongoConverter.fromMongo(user);
        });
    }


    function register(user)
    {
        user.active = false;
        return new Model(user).saveQ().then(function (user)
        {
            return mongoConverter.fromMongo(user);
        }).catch(function (error)
        {
            if (11000 === error.code) {
                throw applicationException.new(applicationException.PRECONDITION_FAILED, 'This email is taken');
            }
        })
    }

    function getDetails(users)
    {
        var promises = _.map(users, function (user)
        {
            return AlertModel.findOneQ({_id: user.alertId}).then(function (alert)
            {
                if (alert) {
                    user.alert = alert.name;
                }
                return user;
            });
        });
        return Promise.all(promises);
    }

    function getAllUser()
    {
        return Model.find({active: true}, {_id: 1, alertId: 1, reportsEmail: 1, timezone: 1, lastReport: 1, alertEmail: 1}).then(function (users)
        {
            return getDetails(mongoConverter.fromMongo(users));
        });
    }

    function activeAccount(userId)
    {
        return Model.findOneAndUpdateQ({_id: userId}, {active: true});
    }

    module.exports = {
        activeAccount: activeAccount,
        register: register,
        getAllUser: getAllUser,
        getUserById: getUserById,
        saveSettings: saveSettings,
        getUserByEmail: getUserByEmail,
        getActiveUserByEmail: getActiveUserByEmail,
        model: Model,
        schema: users
    }
})();
