(function ()
{
    'use strict';
    var applicationException = require('../services/applicationException'),
            business = require('../business/business.container');


    module.exports = function (router)
    {
        router.route('/api/vendor').get(function (request, respond)
        {
            business.getVendorManager(request).search().then(function (result)
            {
                respond.status(200).send(result);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            })
        });

        router.route('/api/vendor').post(function (request, respond)
        {
            business.getVendorManager(request).createOrUpdate(request.body).then(function (results)
            {
                respond.status(200).send(results);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            })
        });

        router.route('/api/vendor/:id').delete(function (request, respond)
        {
            business.getVendorManager(request).remove(request.params.id).then(function ()
            {
                respond.sendStatus(200);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            });
        })
    }
})();
