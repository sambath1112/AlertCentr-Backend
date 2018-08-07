(function ()
{
    'use strict';

    var mongoConverter = require('./mongoConverter'),
            applicationException = require('../services/applicationException'),
            ProductModel = require('./ProductDAO').model,
            mongoose = require('mongoose-q')(),
            vendor = new mongoose.Schema({
                name: {type: String, unique: true}
            }, {
                collection: 'vendor'
            });

    var Model = mongoose.model('vendor', vendor);


    function search()
    {
        return Model.findQ({$query: {}, $orderby: {_id: -1}}).then(function (results)
        {
            return {results: mongoConverter.fromMongo(results)};
        });
    }

    function createOrUpdate(vendor)
    {
        if (!vendor.id) {
            return Model.findOneQ({name: vendor.name}).then(function (result)
            {
                if (result) {
                    throw applicationException.new(applicationException.CONFLICT);
                }
                return Model(vendor).saveQ().then(function (results)
                {
                    return {results: mongoConverter.fromMongo(results)}
                });
            });

        } else {
            return Model.findByIdAndUpdateQ(vendor.id, {name: vendor.name}, {new: true}).then(function (results)
            {
                return {results: mongoConverter.fromMongo(results)}
            });
        }
    }

    function remove(vendorId)
    {
        var DeviceModel = require('./DeviceDAO').model;
        return Model.findByIdAndRemoveQ(vendorId).then(function ()
        {
            return ProductModel.remove({vendorId: vendorId});
        }).then(function ()
        {
            return DeviceModel.remove({vendorId: vendorId});
        });
    }

    function getEntity(vendorId)
    {
        return Model.findByIdQ(vendorId).then(function (results)
        {
            if (!results) {
                throw  applicationException.new(applicationException.NOT_FOUND, 'Vendor not exist');
            }
        });
    }

    module.exports = {
        getEntity: getEntity,
        remove: remove,
        search: search,
        createOrUpdate: createOrUpdate,
        model: Model,
        schema: vendor
    }
})();
