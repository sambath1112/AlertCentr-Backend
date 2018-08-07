(function ()
{
    'use strict';

    var mongoConverter = require('./mongoConverter'),
            moment = require('../services/dateHelper').moment,
            getDate = require('../services/dateHelper').get,
            Promise = require('bluebird'),
            _ = require('lodash'),
            applicationException = require('../services/applicationException'),
            mongoose = require('mongoose-q')(),
            AlertModel = require('./AlertDAO').model,
            GroupModel = require('./GroupDAO').model,
            VendorModel = require('./VendorDAO').model,
            ProductModel = require('./ProductDAO').model,
            EmailModel = require('./EmailDAO').model,
            device = new mongoose.Schema({
                name: {required: true, type: String},
                authorId: {required: true, type: String},
                groupId: {required: true, type: String},
                vendorId: {required: true, type: String},
                productId: {required: true, type: String},
                alertId: {required: true, type: String},
                lastEmailReceive: Number,
                //unique email
                email: {required: true, type: String, unique: true},
                //if is true send email when detect keyword
                forwardEmail: {type: Boolean, default: true},
                //this is true when detect keyword
                status: {type: String, enum: ['detected', 'notDetected', 'delay', 'other'], default: 'other'},
                createDate: {type: Number, default: getDate}
            }, {
                collection: 'device'
            });

    var Model = mongoose.model('device', device);

    function getDetailsDevices(devices)
    {
        var promises = _.map(devices, function (device)
        {
            return AlertModel.findOneQ({_id: device.alertId}).then(function (alert)
            {
                device.alert = mongoConverter.fromMongo(alert).name;
                return GroupModel.findOneQ({_id: device.groupId});
            }).then(function (group)
            {
                device.group = mongoConverter.fromMongo(group).name;
                return VendorModel.findOneQ({_id: device.vendorId});
            }).then(function (vendor)
            {
                device.vendor = mongoConverter.fromMongo(vendor).name;
                return ProductModel.findOneQ({_id: device.productId});
            }).then(function (product)
            {
                device.product = mongoConverter.fromMongo(product).name;
                return EmailModel.countQ({deviceId: device.id});
            }).then(function (countEmail)
            {
                device.countEmail = countEmail;
                return device;
            });
        });
        return Promise.all(promises);
    }

    function search(params)
    {
        var query = {};
        if (params.alertId) {
            query.alertId = params.alertId;
        }
        if (params.productId) {
            query.productId = params.productId;
        }
        if (params.vendorId) {
            query.vendorId = params.vendorId;
        }
        if (params.issues) {
            query.status = params.issues;
        }
        query.authorId = params.authorId;
        query.groupId = params.groupId;
        query.name = {$regex: params.query || '', $options: 'i'};
        return Model.countQ(query).then(function (count)
        {
            return Model.findQ(query, null, {sort: {_id: 1}}).then(function (deviceResult)
            {
                deviceResult = mongoConverter.fromMongo(deviceResult);
                return getDetailsDevices(deviceResult).then(function (results)
                {
                    return {results: results, total: count}
                });
            });
        });

    }

    //this function NOT throw error because i user in email.manager
    function getDeviceByEmail(email)
    {
        return Model.findOneQ({email: email}).then(function (device)
        {
            if (!device) {
                return;
            }
            return mongoConverter.fromMongo(device);
        });
    }

    function createOrUpdate(device)
    {
        if (!device.id) {
            delete  device.createDate;
            return new Model(device).saveQ();
        } else {
            return Model.findByIdAndUpdateQ(device.id, device, {'new': true}).then(function (device)
            {
                device = mongoConverter.fromMongo(device);
                return getDetailsDevices([device]);
            }).then(function (deviceWithDetails)
            {
                return {results: deviceWithDetails[0]}
            });
        }
    }

    function remove(deviceId, userId)
    {
        return Model.findByIdQ(deviceId).then(function (result)
        {
            if (!result) {
                throw  applicationException.new(applicationException.NOT_FOUND);
            }
            result = mongoConverter.fromMongo(result);
            if (userId === result.authorId.toString()) {
                throw applicationException.new(applicationException.FORBIDDEN);
            }
            return Model.findByIdAndRemoveQ(deviceId).then(function ()
            {
                return EmailModel.remove({deviceId: deviceId})
            });
        });
    }

    function getDetailsDeviceWithEmail(devices, timezone)
    {
        var promises = _.map(devices, function (device)
        {
            return AlertModel.findOneQ({_id: device.alertId}).then(function (alert)
            {
                device.forwardEmail = device.forwardEmail ? 'enabled' : 'disabled';
                device.alert = mongoConverter.fromMongo(alert).name;
                return GroupModel.findOneQ({_id: device.groupId});
            }).then(function (group)
            {
                device.group = mongoConverter.fromMongo(group).name;
                return VendorModel.findOneQ({_id: device.vendorId});
            }).then(function (vendor)
            {
                device.vendor = mongoConverter.fromMongo(vendor).name;
                return ProductModel.findOneQ({_id: device.productId});
            }).then(function (product)
            {
                device.product = mongoConverter.fromMongo(product).name;
                return EmailModel.findOneQ(
                        {deviceId: device.id},
                        {keywordSubject: 1, keywordBody: 1, time: 1, status: 1, body: 1},
                        {sort: {_id: -1}}).then(function (email)
                        {
                            if (email) {
                                device.getEmail = mongoConverter.fromMongo(email);
                                device.keyword = device.getEmail.keywordSubject || device.getEmail.keywordBody
                            }
                            if (timezone && device.lastEmailReceive) {
                                device.lastEmailReceive = moment(device.lastEmailReceive).tz(timezone).format('Do MMM - hh:mma')
                            }
                            return device;
                        });
            });
        });
        return Promise.all(promises);
    }

    function getAllDevicesWithDetails(userId)
    {
        return Model.findQ({authorId: userId}).then(function (devices)
        {
            return getDetailsDeviceWithEmail(mongoConverter.fromMongo(devices))
        });
    }

    function reportDevice(userId, timezone)
    {
        return Model.findQ({authorId: userId, status: 'detected'}, null, {sort: 'name'}).then(function (interactionRequired)
        {
            return Model.findQ({authorId: userId, status: {$in: ['notDetected', 'other']}}, null, {sort: 'name'}).then(function (notDetected)
            {
                return Model.findQ({authorId: userId, status: 'delay'}, null, {sort: 'name'}).then(function (delayDevice)
                {

                    var results = {};
                    return getDetailsDeviceWithEmail(mongoConverter.fromMongo(interactionRequired), timezone)
                            .then(function (intReq)
                            {
                                results.interactionRequired = intReq;
                                return getDetailsDeviceWithEmail(mongoConverter.fromMongo(notDetected), timezone);
                            }).then(function (notDetect)
                            {
                                results.notDetected = notDetect;
                                return getDetailsDeviceWithEmail(mongoConverter.fromMongo(delayDevice), timezone);

                            }).then(function (delayedDevices)
                            {
                                results.delay = delayedDevices;
                                return results;
                            });

                });
            });
        });
    }

    function setDelay(deviceId)
    {
        return Model.findByIdAndUpdate(deviceId, {$set: {status: 'delay'}}).exec();
    }

    module.exports = {
        reportDevice: reportDevice,
        getAllDevicesWithDetails: getAllDevicesWithDetails,
        remove: remove,
        search: search,
        getDeviceByEmail: getDeviceByEmail,
        createOrUpdate: createOrUpdate,
        setDelay: setDelay,
        model: Model,
        schema: device
    }
})();
