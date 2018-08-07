(function ()
{
    'use strict';
    var userManager = require('../business/user.manager'),
            applicationException = require('../services/applicationException');

    function authenticate(request, respond, next)
    {
        if (!request.headers.authorization) {
            next();
        } else {
            var token = request.headers.authorization.substring(6);
            token = new Buffer(token, 'base64').toString('ascii');
            userManager.getUserByToken(token).then(function (result)
            {
                request.user = result;
            }).catch(function (error)
            {
                if (applicationException.is(applicationException.UNAUTHORIZED)) {
                    applicationException.errorHandler(error, respond);
                }
            }).finally(next);
        }
    }

    function disableCache(request, respond, next)
    {
        if ('GET' === request.method) {
            respond.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            respond.set('Pragma', 'no-cache');
            respond.set('Expires', 0);
        }
        next();

    }

    module.exports = function (router)
    {
        router.use(authenticate);
        router.use(disableCache);
        require('./user.endpoint')(router);
        require('./group.endpoint')(router);
        require('./device.endpoint')(router);
        require('./vendor.endpoint')(router);
        require('./product.endpoint')(router);
        require('./alert.endpoint')(router);
        require('./email.endpoint')(router);
        require('./sendgrid.endpoint')(router);
    }
})();
