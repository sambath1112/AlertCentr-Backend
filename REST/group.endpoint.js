(function ()
{
    'use strict';
    var applicationException = require('../services/applicationException'),
            business = require('../business/business.container');

    module.exports = function (router)
    {
        router.route('/api/group').get(function (request, respond)
        {
            var query = {
                query: request.query.query || '',
                alertId: request.query.alertId || null,
                productId: request.query.productId || null,
                vendorId: request.query.vendorId || null,
                issues: request.query.issues || null
            };
            business.getGroupManager(request).search(query).then(function (result)
            {
                respond.status(200).send(result);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            })
        });

        router.route('/api/group').post(function (request, respond)
        {
            business.getGroupManager(request).createOrUpdate(request.body).then(function ()
            {
                respond.sendStatus(200);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            });
        });

        router.route('/api/group/:id').delete(function (request, respond)
        {
            business.getGroupManager(request).remove(request.params.id).then(function ()
            {
                respond.sendStatus(200);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            });
        });

        router.route('/api/group/:id').get(function (request, respond)
        {
            business.getGroupManager(request).getEntity(request.params.id).then(function (result)
            {
                respond.status(200).send(result);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            });
        })
    }
})();
