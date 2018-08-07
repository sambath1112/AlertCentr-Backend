(function ()
{
    'use strict';
//detected,notDetected,delay
    var mongoConverter = require('./mongoConverter'),
            applicationException = require('../services/applicationException'),
            mongoose = require('mongoose-q')(),
            getDate = require('./../services/dateHelper').get,
            dateHelper = require('./../services/dateHelper'),
            email = new mongoose.Schema({
                headers: String,
                dkim: String,
                html: String,
                from: String,
                senderIp: String,
                envelope: Object,
                attachments: Number,
                charsets: Object,
                deviceId: String,
                userId: String,
                subject: String,
                body: String,
                time: {type: Number},
                status: {type: Boolean, default: false},
                forwardEmail: String,
                keywordSubject: String,
                keywordBody: String
            }, {
                collection: 'email'
            });

    var Model = mongoose.model('email', email);

    function search(deviceId, query, userId)
    {
        return Model.countQ({deviceId: deviceId, userId: userId}).then(function (count)
        {
            return Model.findOneQ({deviceId: deviceId, userId: userId},
                    {subject: 1, body: 1, html: 1, keywordSubject: 1, keywordBody: 1, time: 1, status: 1},
                    {sort: {_id: 1}, skip: query.from, limit: query.size}).then(function (results)
                    {
                        if (!results) {
                            throw applicationException.new(applicationException.NOT_FOUND);
                        }
                        results = mongoConverter.fromMongo(results);
                        results.body = results.html || results.body;
                        delete  results.html;
                        return {results: results, total: count};
                    });
        });
    }

    function createOrUpdate(email)
    {
        email.time = getDate();
        if (!email.id) {
            return new Model(email).saveQ();
        } else {
            return Model.findByIdAndUpdateQ(email.id, email);
        }
    }

    function remove(deviceId)
    {
        return Model.removeQ({deviceId: deviceId})
    }

    function addEmailToDevice(email)
    {
        return new Model(email).saveQ().then(function (results)
        {
            return mongoConverter.fromMongo(results);
        });
    }

    module.exports = {
        addEmailToDevice: addEmailToDevice,
        search: search,
        remove: remove,
        createOrUpdate: createOrUpdate,
        model: Model,
        schema: email
    }
})();
