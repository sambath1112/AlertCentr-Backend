(function ()
{
    'use strict';
    var mongoConverter = require('./mongoConverter'),
            applicationException = require('../services/applicationException'),
            Promise = require('bluebird'),
            mongoose = require('mongoose-q')(),
            _ = require('lodash'),
            groups = new mongoose.Schema({
                authorId: String,
                name: {required: true, type: String}
            }, {
                collection: 'groups'
            });

    var Model = mongoose.model('groups', groups);

    function getCountDevice(groups, query)
    {
        var DeviceModel = require('./DeviceDAO').model;
        var promises = _.map(groups, function (group)
        {
            query.groupId = group.id;
            return DeviceModel.countQ(query).then(function (count)
            {
                group.count = count;
                return group
            });
        });
        return Promise.all(promises);
    }

    function search(params, authorId)
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
        query.authorId = authorId;
        query.name = {$regex: params.query || '', $options: 'i'};
        return Model.find({authorId: authorId}).count().then(function (count)
        {
            return Model.findQ({authorId: authorId}, null, {sort: 'name'}).then(function (groups)
            {
                groups = mongoConverter.fromMongo(groups);
                return getCountDevice(groups, query).then(function (results)
                {
                    return {results: results, total: count};
                });

            });
        });
    }

    function createOrUpdate(group)
    {
        if (!group.id) {
            return new Model(group).saveQ();
        } else {
            var id = group.id;
            delete group.id;
            return Model.findByIdAndUpdateQ(id, group);
        }
    }

    function remove(userId, groupId)
    {
        var DeviceModel = require('./DeviceDAO').model;
        return Model.findByIdQ(groupId).then(function (result)
        {
            if (!result) {
                throw applicationException.new(applicationException.NOT_FOUND);
            }
            if (userId === result.authorId) {
                throw applicationException.new(applicationException.FORBIDDEN);
            }
            return Model.findByIdAndRemoveQ(groupId).then(function ()
            {
                return DeviceModel.removeQ({groupId: groupId});
            });
        });
    }

    function getEntity(userId, groupId)
    {
        return Model.findOneQ({_id: groupId, authorId: userId}).then(function (result)
        {
            if (!result) {
                throw applicationException.new(applicationException.NOT_FOUND);
            }
            return {results: [mongoConverter.fromMongo(result)], total: 1};
        });
    }

    module.exports = {
        getEntity: getEntity,
        search: search,
        remove: remove,
        createOrUpdate: createOrUpdate,
        model: Model,
        schema: groups
    }
})();
