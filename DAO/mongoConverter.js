(function ()
{
    'use strict';
    function fromMongo(data)
    {
        if (data instanceof Array) {
            return data.map(function (ele)
            {
                return fromMongo(ele);
            });
        } else {
            data._doc.id = data._doc._id;
            delete data._doc._id;
            delete data._doc.__v;
            return data._doc;
        }
    }

    module.exports = {
        fromMongo: fromMongo
    }
})();
