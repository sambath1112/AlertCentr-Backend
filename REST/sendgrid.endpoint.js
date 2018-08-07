(function ()
{
    'use strict';
    var sendgridManager = require('../business/sendgrid.manager'),
            multiparty = require('multiparty');
    module.exports = function (router)
    {
        router.route('/api/sendgrid').post(function (request, respond)
        {
            var form = new multiparty.Form();
            form.parse(request, function (error, fields)
            {
                if (error) {
                    console.error(error);
                    respond.sendStatus(error.statusCode);
                } else {
                    sendgridManager.checkEmail(fields);
                    respond.sendStatus(200);
                }
            })

        })
    }

})();
